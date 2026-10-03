export const kotlinSourceCode = {
  roomEntities: `// ==========================================
// 1. Room Entities (Persistencia Local SQLite)
// ==========================================
package com.teammaster.data.local.entities

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.ForeignKey
import androidx.room.Index

@Entity(tableName = "teams")
data class TeamEntity(
    @PrimaryKey val id: String,
    val name: String,
    val category: String, // 'Libre', 'Veteranos', 'Femenino', etc.
    val primaryColorHex: String,
    val shieldIcon: String,
    val coachName: String?,
    val foundedYear: String?,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "players",
    foreignKeys = [
        ForeignKey(
            entity = TeamEntity::class,
            parentColumns = ["id"],
            childColumns = ["teamId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("teamId")]
)
data class PlayerEntity(
    @PrimaryKey val id: String,
    val teamId: String,
    val fullName: String,
    val nickname: String?,
    val dorsal: Int,
    val position: String, // 'Arquero', 'Defensa', 'Volante', 'Delantero'
    val status: String,   // 'Activo', 'Lesionado', 'Sancionado', 'Inactivo'
    val phone: String,
    val notes: String?,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(
    tableName = "matches",
    foreignKeys = [
        ForeignKey(
            entity = TeamEntity::class,
            parentColumns = ["id"],
            childColumns = ["teamId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("teamId")]
)
data class MatchEntity(
    @PrimaryKey val id: String,
    val teamId: String,
    val tournament: String,        // Línea 1: 🏆 Torneo
    val rival: String,             // Línea 2: ⚽ vs Rival
    val date: String,              // YYYY-MM-DD
    val time: String,              // HH:mm
    val venue: String,             // Cancha
    val totalRefereeFee: Double,   // Arbitraje total
    val individualRefereeFee: Double, // Cuota por jugador
    val status: String,            // 'Programado', 'En Juego', 'Finalizado'
    val homeScore: Int? = null,
    val awayScore: Int? = null,
    val notes: String? = null
)

@Entity(
    tableName = "substitutions",
    foreignKeys = [
        ForeignKey(
            entity = MatchEntity::class,
            parentColumns = ["id"],
            childColumns = ["matchId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("matchId")]
)
data class SubstitutionEntity(
    @PrimaryKey val id: String,
    val matchId: String,
    val teamId: String,
    val playerOutId: String, // Sale (⬇)
    val playerInId: String,  // Entra (⬆)
    val minute: Int,         // Minuto editable
    val notes: String? = null
)

@Entity(
    tableName = "payments",
    indices = [Index("teamId"), Index("playerId"), Index("matchId")]
)
data class PaymentEntity(
    @PrimaryKey val id: String,
    val teamId: String,
    val playerId: String,
    val matchId: String?,
    val amount: Double,
    val date: String,
    val paymentMethod: String,
    val concept: String,
    val notes: String?
)`,

  roomDaos: `// ==========================================
// 2. Room DAOs (Data Access Objects)
// ==========================================
package com.teammaster.data.local.dao

import androidx.room.*
import kotlinx.coroutines.flow.Flow
import com.teammaster.data.local.entities.*

@Dao
interface MatchDao {
    @Query("SELECT * FROM matches WHERE teamId = :teamId ORDER BY date DESC, time DESC")
    fun getMatchesByTeam(teamId: String): Flow<List<MatchEntity>>

    @Query("SELECT * FROM matches WHERE teamId = :teamId AND status = 'Programado' ORDER BY date ASC, time ASC LIMIT 1")
    fun getNextScheduledMatch(teamId: String): Flow<MatchEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMatch(match: MatchEntity)

    @Update
    suspend fun updateMatch(match: MatchEntity)

    @Query("UPDATE matches SET homeScore = :homeScore, awayScore = :awayScore, status = :status WHERE id = :matchId")
    suspend fun updateScore(matchId: String, homeScore: Int, awayScore: Int, status: String)

    @Delete
    suspend fun deleteMatch(match: MatchEntity)
}

@Dao
interface SubstitutionDao {
    @Query("SELECT * FROM substitutions WHERE matchId = :matchId ORDER BY minute ASC")
    fun getSubstitutionsForMatch(matchId: String): Flow<List<SubstitutionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSubstitution(substitution: SubstitutionEntity)

    @Delete
    suspend fun deleteSubstitution(substitution: SubstitutionEntity)
}

@Dao
interface PlayerDao {
    @Query("SELECT * FROM players WHERE teamId = :teamId ORDER BY dorsal ASC")
    fun getPlayersByTeam(teamId: String): Flow<List<PlayerEntity>>

    @Query("SELECT * FROM players WHERE teamId = :teamId AND status = 'Activo'")
    suspend fun getActivePlayers(teamId: String): List<PlayerEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPlayer(player: PlayerEntity)

    @Delete
    suspend fun deletePlayer(player: PlayerEntity)
}`,

  composeUi: `// ==========================================
// 3. Jetpack Compose & Material 3 UI Screen
// ==========================================
package com.teammaster.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.teammaster.data.local.entities.MatchEntity

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MatchCard(
    match: MatchEntity,
    onMassCallupClick: () -> Unit,
    onEditScoreClick: () -> Unit,
    onWhatsAppShareClick: () -> Unit,
    onSubstitutionsClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    ElevatedCard(
        modifier = modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
        colors = CardDefaults.elevatedCardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Línea 1: 🏆 Torneo / Competición (Chip destacado)
            SuggestionChip(
                onClick = {},
                label = { Text("🏆 " + match.tournament, fontWeight = FontWeight.SemiBold) },
                colors = SuggestionChipDefaults.suggestionChipColors(
                    containerColor = Color(0xFFD1FAE5),
                    labelColor = Color(0xFF065F46)
                )
            )

            Spacer(modifier = Modifier.height(6.dp))

            // Línea 2: ⚽ vs Rival (En negrita tipografía destacada)
            Text(
                text = "vs " + match.rival,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(8.dp))

            // Datos del partido: Fecha, Hora, Cancha y Cuota
            Text(
                text = "📅 " + match.date + " · ⏰ " + match.time + " hrs",
                style = MaterialTheme.typography.bodyMedium
            )
            Text(
                text = "📍 " + match.venue,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = "💰 Arbitraje: $" + match.individualRefereeFee.toInt() + " / jugador",
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.height(14.dp))

            // Botones de acción directa
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Convocatoria masiva 1-clic
                FilledTonalButton(
                    onClick = onMassCallupClick,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("⚡ Convocatoria")
                }

                // Marcador
                OutlinedButton(
                    onClick = onEditScoreClick,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("⚽ Marcador")
                }

                // WhatsApp Share
                IconButton(
                    onClick = onWhatsAppShareClick,
                    colors = IconButtonDefaults.filledIconButtonColors(containerColor = Color(0xFF25D366))
                ) {
                    Text("📲", color = Color.White)
                }
            }
        }
    }
}`,

  databaseRoom: `// ==========================================
// 4. Room Database Configuration
// ==========================================
package com.teammaster.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.teammaster.data.local.entities.*
import com.teammaster.data.local.dao.*

@Database(
    entities = [
        TeamEntity::class,
        PlayerEntity::class,
        MatchEntity::class,
        SubstitutionEntity::class,
        PaymentEntity::class
    ],
    version = 1,
    exportSchema = true
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun teamDao(): TeamDao
    abstract fun playerDao(): PlayerDao
    abstract fun matchDao(): MatchDao
    abstract fun substitutionDao(): SubstitutionDao
    abstract fun paymentDao(): PaymentDao
}`
};
