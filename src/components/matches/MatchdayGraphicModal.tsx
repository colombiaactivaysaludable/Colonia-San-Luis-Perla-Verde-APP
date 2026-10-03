import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  X, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  Smartphone, 
  Square, 
  Sparkles,
  Trophy,
  Filter,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Image as ImageIcon,
  Layers,
  Palette
} from 'lucide-react';
import { Match, Player, Callup } from '../../types';
import { useStorage } from '../../hooks/useStorage';
import { 
  formatDateSpanish, 
  formatCurrency, 
  generateFinalSquadWhatsAppMessage, 
  openWhatsApp 
} from '../../utils/whatsapp';

interface MatchdayGraphicModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
}

// Default policy: exclude unanswered players from final squad announcement
const EXCLUDE_UNANSWERED_DEFAULT = true;

type TurfTheme = 'night_pitch' | 'emerald_elite' | 'copa_stadium';

// Image loader cache to prevent re-fetching and ensure crisp canvas drawing
const imageCache = new Map<string, HTMLImageElement>();

function preloadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    return Promise.resolve(imageCache.get(src)!);
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

export const MatchdayGraphicModal: React.FC<MatchdayGraphicModalProps> = ({
  match,
  isOpen,
  onClose,
}) => {
  const { storage, activeTeam } = useStorage();

  const [aspectRatio, setAspectRatio] = useState<'1:1' | '9:16'>('1:1');
  const [theme, setTheme] = useState<TurfTheme>('night_pitch');
  const [excludeUnanswered, setExcludeUnanswered] = useState(EXCLUDE_UNANSWERED_DEFAULT);
  const [customHashtag, setCustomHashtag] = useState(activeTeam?.customHashtag || '#VamosColonia');
  const [copiedText, setCopiedText] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const allPlayers = match ? storage.getPlayers(match.teamId) : [];
  const callups = match ? storage.getCallupsForMatch(match.id) : [];

  // Filter players for final squad (memoized to avoid continuous re-render loops)
  const finalSquadPlayers = useMemo(() => {
    return allPlayers
      .filter((player) => {
        const callup = callups.find((c) => c.playerId === player.id);
        if (!callup || callup.status === 'No Convocado' || callup.status === 'Inasistencia') {
          return false;
        }
        if (callup.confirmationStatus === 'No Asiste') {
          return false;
        }
        if (callup.confirmationStatus === 'Confirmado') {
          return true;
        }
        // If pending / unanswered
        return !excludeUnanswered;
      })
      .sort((a, b) => a.dorsal - b.dorsal);
  }, [allPlayers, callups, excludeUnanswered]);

  // Stable string key of image URLs to only preload when URLs change
  const imageUrlsKey = useMemo(() => {
    const urls: string[] = [];
    if (activeTeam?.logoUrl) urls.push(activeTeam.logoUrl);
    finalSquadPlayers.forEach((p) => {
      if (p.photoUrl) urls.push(p.photoUrl);
    });
    return urls.join('|');
  }, [activeTeam?.logoUrl, finalSquadPlayers]);

  // Preload team logo and player photos without re-rendering loops
  useEffect(() => {
    if (!isOpen || !match || !imageUrlsKey) return;

    const urlsToLoad = imageUrlsKey.split('|').filter(Boolean);
    if (urlsToLoad.length === 0) return;

    let isMounted = true;
    let loadedCount = 0;
    urlsToLoad.forEach((url) => {
      preloadImage(url)
        .then(() => {
          if (!isMounted) return;
          loadedCount++;
          if (loadedCount === urlsToLoad.length) {
            setImagesLoaded((c) => c + 1);
          }
        })
        .catch(() => {});
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen, match?.id, imageUrlsKey]);

  /**
   * Procedural Matchday Realistic Pitch & Stadium Background
   * Renders photographic grass texture, floodlight flares, pitch markings, and vignette
   */
  const drawPhotographicStadiumBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    themeMode: TurfTheme
  ) => {
    // 1. Base Turf Color Gradient
    const turfGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (themeMode === 'night_pitch') {
      turfGrad.addColorStop(0, '#022114');
      turfGrad.addColorStop(0.2, '#063920');
      turfGrad.addColorStop(0.5, '#0b4929');
      turfGrad.addColorStop(0.8, '#07331c');
      turfGrad.addColorStop(1, '#02180e');
    } else if (themeMode === 'copa_stadium') {
      turfGrad.addColorStop(0, '#061a14');
      turfGrad.addColorStop(0.3, '#0b3527');
      turfGrad.addColorStop(0.7, '#08251c');
      turfGrad.addColorStop(1, '#051119');
    } else {
      turfGrad.addColorStop(0, '#042718');
      turfGrad.addColorStop(0.25, '#094d2c');
      turfGrad.addColorStop(0.6, '#0f6138');
      turfGrad.addColorStop(0.85, '#094627');
      turfGrad.addColorStop(1, '#032014');
    }
    ctx.fillStyle = turfGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Realistic Grass Mowing Horizontal Stripes
    const stripeHeight = aspectRatio === '1:1' ? 70 : 85;
    for (let y = 0; y < height; y += stripeHeight) {
      const isEven = Math.floor(y / stripeHeight) % 2 === 0;
      ctx.fillStyle = isEven ? 'rgba(255, 255, 255, 0.022)' : 'rgba(0, 0, 0, 0.055)';
      ctx.fillRect(0, y, width, stripeHeight);
    }

    // 3. Grass Blades Micro-Texture (Procedural Seeded Noise for Organic Turf Feel)
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    for (let i = 0; i < 4000; i++) {
      const rx = (Math.sin(i * 12.9898) * 43758.5453 - Math.floor(Math.sin(i * 12.9898) * 43758.5453)) * width;
      const ry = (Math.sin(i * 78.233) * 43758.5453 - Math.floor(Math.sin(i * 78.233) * 43758.5453)) * height;
      ctx.fillRect(rx, ry, 2, 4);
    }
    ctx.restore();

    // 4. Pitch Markings: Center Circle & Glow Lines (Crisp white with stadium glow)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgba(52, 211, 153, 0.4)';
    ctx.shadowBlur = 12;

    // Pitch center circle arc
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.48, width * 0.38, 0, Math.PI * 2);
    ctx.stroke();

    // Center halfway line
    ctx.beginPath();
    ctx.moveTo(0, height * 0.48);
    ctx.lineTo(width, height * 0.48);
    ctx.stroke();

    // Center spot
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.48, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. Powerful Stadium Floodlight Beams & Light Halos
    // Top-Left Floodlight
    const leftBeam = ctx.createRadialGradient(0, 0, 30, 0, 0, width * 0.95);
    leftBeam.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    leftBeam.addColorStop(0.15, 'rgba(52, 211, 153, 0.25)');
    leftBeam.addColorStop(0.4, 'rgba(16, 185, 129, 0.08)');
    leftBeam.addColorStop(1, 'transparent');
    ctx.fillStyle = leftBeam;
    ctx.fillRect(0, 0, width, height);

    // Top-Right Floodlight
    const rightBeam = ctx.createRadialGradient(width, 0, 30, width, 0, width * 0.95);
    rightBeam.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
    rightBeam.addColorStop(0.15, 'rgba(52, 211, 153, 0.25)');
    rightBeam.addColorStop(0.4, 'rgba(16, 185, 129, 0.08)');
    rightBeam.addColorStop(1, 'transparent');
    ctx.fillStyle = rightBeam;
    ctx.fillRect(0, 0, width, height);

    // Center Top Glow
    const centerGlow = ctx.createRadialGradient(width / 2, 0, 10, width / 2, 100, width * 0.6);
    centerGlow.addColorStop(0, 'rgba(254, 240, 138, 0.25)'); // subtle golden highlight
    centerGlow.addColorStop(0.5, 'rgba(16, 185, 129, 0.1)');
    centerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, width, height);

    // 6. Deep Cinematic Vignette (Ensures deep contrast on borders)
    const vignette = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.35,
      width / 2,
      height / 2,
      width * 0.75
    );
    vignette.addColorStop(0, 'transparent');
    vignette.addColorStop(0.65, 'rgba(2, 24, 15, 0.4)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // 7. Dynamic Diagonal Club Accent Stripes (San Luis Green & Pure White)
    ctx.save();
    ctx.rotate((-12 * Math.PI) / 180);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';
    ctx.fillRect(-width * 0.5, height * 0.2, width * 2, 180);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.fillRect(-width * 0.5, height * 0.35, width * 2, 80);
    ctx.restore();
  };

  /**
   * Main Canvas Render Loop
   */
  const renderCanvas = useCallback(() => {
    if (!isOpen || !match) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = aspectRatio === '1:1' ? 1080 : 1920;
    canvas.width = width;
    canvas.height = height;

    // 1. Draw Textured Stadium Pitch & Lights
    drawPhotographicStadiumBackground(ctx, width, height, theme);

    // 2. High-Tech Precision Sports Border
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(32, 32, width - 64, height - 64);

    // Golden corner corner notches
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 5;
    const notchLen = 40;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(30, 30 + notchLen);
    ctx.lineTo(30, 30);
    ctx.lineTo(30 + notchLen, 30);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(width - 30 - notchLen, 30);
    ctx.lineTo(width - 30, 30);
    ctx.lineTo(width - 30, 30 + notchLen);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(30, height - 30 - notchLen);
    ctx.lineTo(30, height - 30);
    ctx.lineTo(30 + notchLen, height - 30);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(width - 30 - notchLen, height - 30);
    ctx.lineTo(width - 30, height - 30);
    ctx.lineTo(width - 30, height - 30 - notchLen);
    ctx.stroke();
    ctx.restore();

    // 3. Top Ribbon Badge: Tournament / Competition Name
    const tournamentName = (match.tournament || 'TORNEO BARRIAL OFICIAL').toUpperCase();
    ctx.save();
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    // Angled ribbon tag in top-right
    const ribW = 420;
    const ribH = 44;
    const ribX = width - ribW - 48;
    const ribY = 48;
    ctx.moveTo(ribX + 24, ribY);
    ctx.lineTo(ribX + ribW, ribY);
    ctx.lineTo(ribX + ribW - 12, ribY + ribH);
    ctx.lineTo(ribX, ribY + ribH);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = '900 17px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🏆 ${tournamentName}`, ribX + ribW / 2 + 6, ribY + 28);
    ctx.restore();

    // 4. Matchday Tag Top-Left
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.roundRect(48, 48, 220, 40, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 16px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ MATCHDAY SQUAD', 158, 73);
    ctx.restore();

    // 5. Club Header & Crest / Real Logo
    const headerCenterY = aspectRatio === '1:1' ? 145 : 210;

    // Club Crest / Real Logo Drawing
    const logoRadius = aspectRatio === '1:1' ? 48 : 58;
    const logoY = headerCenterY - 10;
    const logoX = width / 2;

    ctx.save();
    // Circular outer golden halo
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoRadius + 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.fill();

    // White circle backdrop
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Clip and draw image or shield
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoRadius - 2, 0, Math.PI * 2);
    ctx.clip();

    let logoDrawn = false;
    if (activeTeam?.logoUrl && imageCache.has(activeTeam.logoUrl)) {
      const logoImg = imageCache.get(activeTeam.logoUrl)!;
      try {
        ctx.drawImage(
          logoImg,
          logoX - (logoRadius - 4),
          logoY - (logoRadius - 4),
          (logoRadius - 4) * 2,
          (logoRadius - 4) * 2
        );
        logoDrawn = true;
      } catch (e) {
        logoDrawn = false;
      }
    }

    if (!logoDrawn) {
      // Draw Antioquia Green & White Official Badge
      const bgGrad = ctx.createLinearGradient(logoX - logoRadius, logoY - logoRadius, logoX + logoRadius, logoY + logoRadius);
      bgGrad.addColorStop(0, '#047857');
      bgGrad.addColorStop(1, '#064e3b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(logoX - logoRadius, logoY - logoRadius, logoRadius * 2, logoRadius * 2);

      // White stripe in the middle
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(logoX - 12, logoY - logoRadius, 24, logoRadius * 2);

      ctx.fillStyle = '#ffffff';
      ctx.font = `${logoRadius * 0.9}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(activeTeam?.shieldIcon || '🌲', logoX, logoY);
    }
    ctx.restore();
    ctx.restore();

    // Club Name & Slogan (Extra Bold Athletic Typography)
    const clubTitleY = logoY + logoRadius + (aspectRatio === '1:1' ? 38 : 50);
    ctx.save();
    ctx.textAlign = 'center';

    // Drop Shadow for high contrast
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 44px system-ui, -apple-system, sans-serif';
    ctx.fillText('COLONIA SAN LUIS', width / 2, clubTitleY);

    ctx.shadowBlur = 10;
    ctx.fillStyle = '#34d399';
    ctx.font = '800 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('PERLA VERDE', width / 2, clubTitleY + 34);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'italic 600 15px system-ui, sans-serif';
    ctx.fillText(`"${activeTeam?.slogan || 'La Perla Bonita de Antioquia'}"`, width / 2, clubTitleY + 60);
    ctx.restore();

    // 6. Match Announcement Block (Frosted Glass Card with Rival & Match Metadata)
    const matchBlockY = clubTitleY + (aspectRatio === '1:1' ? 82 : 95);
    const matchBlockH = aspectRatio === '1:1' ? 95 : 120;
    const matchBlockW = width - 120;
    const matchBlockX = 60;

    ctx.save();
    // Frosted dark-emerald glass backing
    ctx.fillStyle = 'rgba(4, 30, 20, 0.82)';
    ctx.beginPath();
    ctx.roundRect(matchBlockX, matchBlockY, matchBlockW, matchBlockH, 22);
    ctx.fill();
    ctx.strokeStyle = 'rgba(52, 211, 153, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Inner glow
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(matchBlockX + 4, matchBlockY + 4, matchBlockW - 8, matchBlockH - 8);

    // Rival Heading
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fef08a';
    ctx.font = '900 34px system-ui, -apple-system, sans-serif';
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 10;
    ctx.fillText(`vs ${match.rival.toUpperCase()}`, width / 2, matchBlockY + 44);

    // Match info line: Date, Time, Venue, Arrival
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 18px system-ui, sans-serif';
    const dateFormatted = formatDateSpanish(match.date).toUpperCase();
    const arrivalText = match.arrivalMinutes ? ` · LLEGAR ${match.arrivalMinutes} MIN ANTES` : '';
    ctx.fillText(
      `📅 ${dateFormatted}   |   🕐 ${match.time} HRS   |   📍 ${match.venue.toUpperCase()}${arrivalText}`,
      width / 2,
      matchBlockY + 76
    );
    ctx.restore();

    // 7. Squad Section Title with Pill
    const squadTitleY = matchBlockY + matchBlockH + (aspectRatio === '1:1' ? 36 : 50);
    ctx.save();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(60, squadTitleY - 26, 360, 38, 12);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = '900 18px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`CONVOCADOS (${finalSquadPlayers.length})`, 78, squadTitleY - 2);

    ctx.fillStyle = '#6ee7b7';
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('OFICIAL · LISTA DE PARTIDO', width - 65, squadTitleY - 2);
    ctx.restore();

    // 8. Players Grid (Supporting Circular Photos or Jersey Dorsal Badges)
    const playersStartY = squadTitleY + 24;
    const bottomReserved = aspectRatio === '1:1' ? 90 : 120;
    const availableHeight = height - playersStartY - bottomReserved;

    // Number of columns: in 1:1, if <= 14 players use 2 cols, if > 14 use 3 cols
    // in 9:16 vertical, use 2 cols or position grouping
    const cols = aspectRatio === '1:1' && finalSquadPlayers.length > 14 ? 3 : 2;
    const colPadding = 18;
    const colWidth = (width - 120 - colPadding * (cols - 1)) / cols;
    const rows = Math.ceil(finalSquadPlayers.length / cols);
    const rowHeight = Math.min(
      aspectRatio === '1:1' ? 44 : 58,
      availableHeight / Math.max(rows, 1)
    );

    finalSquadPlayers.forEach((player, idx) => {
      const colIdx = Math.floor(idx / rows);
      const rowIdx = idx % rows;
      const x = 60 + colIdx * (colWidth + colPadding);
      const y = playersStartY + rowIdx * rowHeight;

      const badgeRadius = Math.min(18, rowHeight * 0.4);
      const badgeCenterX = x + badgeRadius + 4;
      const badgeCenterY = y + rowHeight / 2;

      // Card row background for optimal readability over photo
      ctx.save();
      ctx.fillStyle = 'rgba(6, 40, 26, 0.65)';
      ctx.beginPath();
      ctx.roundRect(x, y + 2, colWidth, rowHeight - 4, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Check if player has loaded photo
      let photoRendered = false;
      if (player.photoUrl && imageCache.has(player.photoUrl)) {
        const photoImg = imageCache.get(player.photoUrl)!;
        try {
          ctx.save();
          ctx.beginPath();
          ctx.arc(badgeCenterX, badgeCenterY, badgeRadius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(
            photoImg,
            badgeCenterX - badgeRadius,
            badgeCenterY - badgeRadius,
            badgeRadius * 2,
            badgeRadius * 2
          );
          ctx.restore();

          // Border for photo
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(badgeCenterX, badgeCenterY, badgeRadius, 0, Math.PI * 2);
          ctx.stroke();

          // Small dorsal chip in corner of photo
          const chipR = 9;
          const chipX = badgeCenterX + badgeRadius - 4;
          const chipY = badgeCenterY + badgeRadius - 4;
          ctx.fillStyle = '#059669';
          ctx.beginPath();
          ctx.arc(chipX, chipY, chipR, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = '900 10px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(player.dorsal), chipX, chipY);

          photoRendered = true;
        } catch (e) {
          photoRendered = false;
        }
      }

      // Fallback: Circular athletic jersey badge with dorsal number
      if (!photoRendered) {
        ctx.fillStyle = '#059669';
        ctx.beginPath();
        ctx.arc(badgeCenterX, badgeCenterY, badgeRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = `900 ${badgeRadius * 0.9}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(player.dorsal), badgeCenterX, badgeCenterY);
      }

      // Player Name
      const textStartX = badgeCenterX + badgeRadius + 12;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.font = `800 ${cols === 3 ? 15 : 18}px system-ui, sans-serif`;

      let displayName = player.fullName;
      if (player.nickname) {
        const first = player.fullName.split(' ')[0];
        displayName = `${first} "${player.nickname}"`;
      }
      // Truncate if too long
      const maxTextW = colWidth - (badgeRadius * 2 + 75);
      if (ctx.measureText(displayName).width > maxTextW) {
        displayName = displayName.substring(0, 16) + '…';
      }
      ctx.fillText(displayName, textStartX, badgeCenterY);

      // Position Tag Badge (right aligned inside row)
      const posTag = player.position.substring(0, 3).toUpperCase();
      ctx.fillStyle =
        player.position === 'Arquero'
          ? '#f59e0b'
          : player.position === 'Defensa'
          ? '#60a5fa'
          : player.position === 'Volante'
          ? '#34d399'
          : '#f87171';

      ctx.font = '800 11px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(posTag, x + colWidth - 10, badgeCenterY);

      ctx.restore();
    });

    // 9. Matchday Footer: Hashtags & Team Identity
    const footerY = height - 48;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#34d399';
    ctx.font = '900 21px system-ui, -apple-system, sans-serif';
    ctx.letterSpacing = '1px';
    const finalHashtags = `#ColoniaSanLuis   ${customHashtag}   #PerlaVerde`;
    ctx.fillText(finalHashtags, width / 2, footerY);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.fillText('CONVOCATORIA OFICIAL DE PARTIDO · AFICIÓN Y PASIÓN SANLUISANA', width / 2, footerY + 24);
    ctx.restore();
  }, [match, aspectRatio, theme, excludeUnanswered, customHashtag, finalSquadPlayers, activeTeam, imagesLoaded]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Download high-resolution PNG image
  const handleDownloadImage = () => {
    if (!match) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsDownloading(true);

    try {
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const safeRival = match.rival.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `Matchday_ColoniaSanLuis_vs_${safeRival}_${aspectRatio.replace(':', 'x')}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error downloading graphic:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  // Copy final squad announcement for WhatsApp
  const handleCopyWhatsAppText = () => {
    if (!match) return;
    const text = generateFinalSquadWhatsAppMessage(
      match,
      finalSquadPlayers,
      activeTeam?.name || 'Colonia San Luis – Perla Verde'
    );
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleShareWhatsApp = () => {
    if (!match) return;
    const text = generateFinalSquadWhatsAppMessage(
      match,
      finalSquadPlayers,
      activeTeam?.name || 'Colonia San Luis – Perla Verde'
    );
    openWhatsApp(text);
  };

  if (!isOpen || !match) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[96vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎨</span>
            <div>
              <h2 className="text-base font-black text-white leading-tight flex items-center gap-1.5">
                <span>Cartelera Oficial Matchday Graphic</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  PRO CLUB
                </span>
              </h2>
              <p className="text-[11px] text-emerald-400 font-semibold truncate max-w-md">
                {match.tournament} vs {match.rival} ({formatDateSpanish(match.date)})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls & Configuration Bar */}
        <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Aspect Ratio Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setAspectRatio('1:1')}
              className={`py-1.5 px-3 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                aspectRatio === '1:1'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>1:1 Cuadrado (Feed)</span>
            </button>
            <button
              onClick={() => setAspectRatio('9:16')}
              className={`py-1.5 px-3 rounded-lg font-bold flex items-center gap-1.5 transition-all ${
                aspectRatio === '9:16'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>9:16 Vertical (Stories)</span>
            </button>
          </div>

          {/* Theme Selector */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <Palette className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as TurfTheme)}
              className="bg-slate-900 text-white border border-slate-800 rounded-lg py-1 px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="night_pitch">🏟️ Césped Estadio Nocturno</option>
              <option value="copa_stadium">🏆 Noche de Copa Élite</option>
              <option value="emerald_elite">🌲 Perla Verde San Luis</option>
            </select>
          </div>

          {/* Filter unanswered toggle (configurable parameter as required) */}
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
            <input
              type="checkbox"
              checked={excludeUnanswered}
              onChange={(e) => setExcludeUnanswered(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-700"
            />
            <span>Excluir sin responder ({finalSquadPlayers.length} confirmados)</span>
          </label>
        </div>

        {/* Content Body / Canvas Preview Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-slate-950/90 relative">
          <div className="relative shadow-2xl rounded-2xl overflow-hidden border border-emerald-500/40 max-w-full">
            <canvas
              ref={canvasRef}
              className="w-auto h-auto max-h-[48vh] sm:max-h-[52vh] object-contain rounded-2xl block shadow-inner"
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400 mt-2.5 text-center">
            <span>✨ Textura de cancha real & reflectores activos</span>
            <span>·</span>
            <span>📸 Soporte de fotos circulares para cada jugador</span>
            <span>·</span>
            <span>🟢⚪ Identidad Sanluisana</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-2.5">
          {/* Copy WhatsApp Announcement */}
          <button
            onClick={handleCopyWhatsAppText}
            className="w-full sm:w-auto py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {copiedText ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedText ? '¡Texto Copiado!' : 'Copiar Texto para WhatsApp'}</span>
          </button>

          {/* WhatsApp Direct Share */}
          <button
            onClick={handleShareWhatsApp}
            className="w-full sm:w-auto py-2.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartir Anuncio en WhatsApp</span>
          </button>

          {/* Download Image Button */}
          <button
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="w-full sm:w-auto sm:ml-auto py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Descargar Imagen ({aspectRatio})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
