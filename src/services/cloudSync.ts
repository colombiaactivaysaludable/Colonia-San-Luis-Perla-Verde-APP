import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from './firebase';
import { 
  Team, 
  Player, 
  Match, 
  Callup, 
  Substitution, 
  MatchPlayerStat, 
  Payment 
} from '../types';
import { storage } from './storage';

export type CloudSyncStatus = 'connecting' | 'synced' | 'saving' | 'offline' | 'error';

interface CloudSyncState {
  status: CloudSyncStatus;
  lastSyncedAt: string | null;
  errorMessage: string | null;
}

const syncListeners = new Set<(state: CloudSyncState) => void>();

let currentState: CloudSyncState = {
  status: 'connecting',
  lastSyncedAt: null,
  errorMessage: null,
};

function updateState(partial: Partial<CloudSyncState>) {
  currentState = { ...currentState, ...partial };
  syncListeners.forEach((fn) => fn(currentState));
}

export const cloudSync = {
  getState(): CloudSyncState {
    return currentState;
  },

  subscribe(listener: (state: CloudSyncState) => void): () => void {
    syncListeners.add(listener);
    listener(currentState);
    return () => syncListeners.delete(listener);
  },

  async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      updateState({ status: 'connecting' });
      await testFirestoreConnection();

      // Check if cloud already has teams. If empty, perform initial cloud upload
      const teamsSnap = await getDocs(collection(db, 'teams')).catch((err: any) => {
        if (err?.code === 'unavailable' || (err instanceof Error && err.message.includes('offline'))) {
          console.warn('Firestore backend currently offline/unavailable; continuing in offline mode.');
          return null;
        }
        handleFirestoreError(err, OperationType.LIST, 'teams');
        return null;
      });

      if (teamsSnap && teamsSnap.empty) {
        console.log('Cloud Firestore is empty. Initializing cloud database with team data...');
        await this.uploadAllLocalDataToCloud();
      }

      // Attach real-time snapshot listeners for multi-device sync
      this.setupRealtimeListeners();

      // Hook into local mutations to save changes directly to Cloud Firestore
      storage.onCloudMutation(async (action, entity, payload) => {
        try {
          if (action === 'save') {
            if (entity === 'team') await cloudSync.saveTeam(payload);
            else if (entity === 'player') await cloudSync.savePlayer(payload);
            else if (entity === 'match') await cloudSync.saveMatch(payload);
            else if (entity === 'callup') await cloudSync.saveCallup(payload);
            else if (entity === 'substitution') await cloudSync.saveSubstitution(payload);
            else if (entity === 'stat') await cloudSync.saveStat(payload);
            else if (entity === 'payment') await cloudSync.savePayment(payload);
          } else if (action === 'delete') {
            if (entity === 'team') await cloudSync.deleteTeam(payload);
            else if (entity === 'player') await cloudSync.deletePlayer(payload);
            else if (entity === 'match') await cloudSync.deleteMatch(payload);
            else if (entity === 'substitution') await cloudSync.deleteSubstitution(payload);
            else if (entity === 'payment') await cloudSync.deletePayment(payload);
          }
        } catch (e) {
          console.warn('Background cloud mutation sync notice:', e);
        }
      });

      updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
    } catch (err: any) {
      console.warn('Cloud sync initialization notice:', err);
      updateState({ 
        status: navigator.onLine ? 'error' : 'offline', 
        errorMessage: err?.message || 'Error de conexión' 
      });
    }
  },

  setupRealtimeListeners() {
    // 1. Teams
    onSnapshot(collection(db, 'teams'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudTeams: Team[] = [];
        snapshot.forEach((doc) => cloudTeams.push(doc.data() as Team));
        storage.mergeCloudTeams(cloudTeams);
        updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'teams');
    });

    // 2. Players
    onSnapshot(collection(db, 'players'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudPlayers: Player[] = [];
        snapshot.forEach((doc) => cloudPlayers.push(doc.data() as Player));
        storage.mergeCloudPlayers(cloudPlayers);
        updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'players');
    });

    // 3. Matches
    onSnapshot(collection(db, 'matches'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudMatches: Match[] = [];
        snapshot.forEach((doc) => cloudMatches.push(doc.data() as Match));
        storage.mergeCloudMatches(cloudMatches);
        updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'matches');
    });

    // 4. Callups
    onSnapshot(collection(db, 'callups'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudCallups: Callup[] = [];
        snapshot.forEach((doc) => cloudCallups.push(doc.data() as Callup));
        storage.mergeCloudCallups(cloudCallups);
        updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'callups');
    });

    // 5. Substitutions
    onSnapshot(collection(db, 'substitutions'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudSubs: Substitution[] = [];
        snapshot.forEach((doc) => cloudSubs.push(doc.data() as Substitution));
        storage.mergeCloudSubstitutions(cloudSubs);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'substitutions');
    });

    // 6. Stats
    onSnapshot(collection(db, 'matchPlayerStats'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudStats: MatchPlayerStat[] = [];
        snapshot.forEach((doc) => cloudStats.push(doc.data() as MatchPlayerStat));
        storage.mergeCloudStats(cloudStats);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'matchPlayerStats');
    });

    // 7. Payments
    onSnapshot(collection(db, 'payments'), (snapshot) => {
      if (!snapshot.empty) {
        const cloudPayments: Payment[] = [];
        snapshot.forEach((doc) => cloudPayments.push(doc.data() as Payment));
        storage.mergeCloudPayments(cloudPayments);
        updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'payments');
    });
  },

  // --- Direct Cloud Write Methods with Error Handling ---

  async saveTeam(team: Team): Promise<void> {
    updateState({ status: 'saving' });
    const path = `teams/${team.id}`;
    try {
      await setDoc(doc(db, 'teams', team.id), team);
      updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
    } catch (err) {
      updateState({ status: 'error' });
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteTeam(teamId: string): Promise<void> {
    updateState({ status: 'saving' });
    const path = `teams/${teamId}`;
    try {
      await deleteDoc(doc(db, 'teams', teamId));
      updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
    } catch (err) {
      updateState({ status: 'error' });
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async savePlayer(player: Player): Promise<void> {
    updateState({ status: 'saving' });
    const path = `players/${player.id}`;
    try {
      await setDoc(doc(db, 'players', player.id), player);
      updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
    } catch (err) {
      updateState({ status: 'error' });
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deletePlayer(playerId: string): Promise<void> {
    updateState({ status: 'saving' });
    const path = `players/${playerId}`;
    try {
      await deleteDoc(doc(db, 'players', playerId));
      updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
    } catch (err) {
      updateState({ status: 'error' });
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async saveMatch(match: Match): Promise<void> {
    updateState({ status: 'saving' });
    const path = `matches/${match.id}`;
    try {
      await setDoc(doc(db, 'matches', match.id), match);
      updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
    } catch (err) {
      updateState({ status: 'error' });
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteMatch(matchId: string): Promise<void> {
    updateState({ status: 'saving' });
    const path = `matches/${matchId}`;
    try {
      await deleteDoc(doc(db, 'matches', matchId));
      updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
    } catch (err) {
      updateState({ status: 'error' });
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async saveCallup(callup: Callup): Promise<void> {
    updateState({ status: 'saving' });
    const path = `callups/${callup.id}`;
    try {
      const cleanData: Record<string, any> = {};
      Object.entries(callup).forEach(([k, v]) => {
        if (v !== undefined) cleanData[k] = v;
      });
      await setDoc(doc(db, 'callups', callup.id), cleanData, { merge: true });
      updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
    } catch (err) {
      updateState({ status: 'error' });
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async saveSubstitution(sub: Substitution): Promise<void> {
    updateState({ status: 'saving' });
    const path = `substitutions/${sub.id}`;
    try {
      await setDoc(doc(db, 'substitutions', sub.id), sub);
      updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
    } catch (err) {
      updateState({ status: 'error' });
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deleteSubstitution(subId: string): Promise<void> {
    updateState({ status: 'saving' });
    const path = `substitutions/${subId}`;
    try {
      await deleteDoc(doc(db, 'substitutions', subId));
      updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
    } catch (err) {
      updateState({ status: 'error' });
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async saveStat(stat: MatchPlayerStat): Promise<void> {
    updateState({ status: 'saving' });
    const path = `matchPlayerStats/${stat.id}`;
    try {
      await setDoc(doc(db, 'matchPlayerStats', stat.id), stat);
      updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
    } catch (err) {
      updateState({ status: 'error' });
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async savePayment(payment: Payment): Promise<void> {
    updateState({ status: 'saving' });
    const path = `payments/${payment.id}`;
    try {
      await setDoc(doc(db, 'payments', payment.id), payment);
      updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
    } catch (err) {
      updateState({ status: 'error' });
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  async deletePayment(paymentId: string): Promise<void> {
    updateState({ status: 'saving' });
    const path = `payments/${paymentId}`;
    try {
      await deleteDoc(doc(db, 'payments', paymentId));
      updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
    } catch (err) {
      updateState({ status: 'error' });
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  async uploadAllLocalDataToCloud(): Promise<void> {
    updateState({ status: 'saving' });
    try {
      const backup = storage.exportBackup();
      const batch = writeBatch(db);

      // Teams
      backup.teams.forEach((t: Team) => batch.set(doc(db, 'teams', t.id), t));
      // Players
      backup.players.forEach((p: Player) => batch.set(doc(db, 'players', p.id), p));
      // Matches
      backup.matches.forEach((m: Match) => batch.set(doc(db, 'matches', m.id), m));
      // Callups
      backup.callups.forEach((c: Callup) => batch.set(doc(db, 'callups', c.id), c));
      // Substitutions
      backup.substitutions.forEach((s: Substitution) => batch.set(doc(db, 'substitutions', s.id), s));
      // Stats
      backup.matchPlayerStats.forEach((st: MatchPlayerStat) => batch.set(doc(db, 'matchPlayerStats', st.id), st));
      // Payments
      backup.payments.forEach((py: Payment) => batch.set(doc(db, 'payments', py.id), py));

      await batch.commit();
      console.log('All local data successfully saved in Firestore Cloud!');
      updateState({ status: 'synced', lastSyncedAt: new Date().toLocaleTimeString() });
    } catch (err) {
      updateState({ status: 'error' });
      handleFirestoreError(err, OperationType.WRITE, 'batch-upload');
    }
  }
};
