import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type PlatformType = 'android' | 'apple' | 'mac' | 'windows' | 'unknown';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<PlatformType>('android');
  const [isInIframe, setIsInIframe] = useState(false);
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    // Current standalone URL
    const url = window.location.href;
    setAppUrl(url);

    // Check if running inside an iframe
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    // Check if already running in standalone display mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect user platform
    const ua = window.navigator.userAgent.toLowerCase();
    if (/android/.test(ua)) {
      setPlatform('android');
    } else if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('apple');
    } else if (/macintosh|mac os x/.test(ua)) {
      setPlatform('mac');
    } else if (/windows/.test(ua)) {
      setPlatform('windows');
    } else {
      setPlatform('android');
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // 1. Android Direct Launcher Download (.html standalone web app)
  // This NEVER fails, never requires Google WebAPK minting server, works on EVERY Android phone
  const downloadAndroidLauncher = () => {
    const targetUrl = window.location.href;
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Colonia San Luis - Perla Verde</title>
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="theme-color" content="#064e3b">
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; padding: 20px;
      background: linear-gradient(135deg, #064e3b 0%, #022c22 100%);
      color: #ffffff;
      font-family: system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center;
    }
    .card {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 28px;
      padding: 32px 24px;
      max-width: 360px;
      width: 100%;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
    }
    .icon { font-size: 64px; margin-bottom: 12px; }
    h1 { font-size: 20px; font-weight: 900; margin: 0 0 6px 0; }
    .slogan { font-size: 13px; color: #6ee7b7; font-style: italic; margin-bottom: 24px; }
    .btn {
      display: block;
      width: 100%;
      background: #10b981;
      color: #ffffff;
      padding: 16px;
      border-radius: 18px;
      font-weight: 800;
      font-size: 15px;
      text-decoration: none;
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
      margin-bottom: 12px;
    }
    .hint { font-size: 11px; opacity: 0.8; line-height: 1.4; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🌲</div>
    <h1>Colonia San Luis</h1>
    <div class="slogan">"La Perla Bonita de Antioquia"</div>
    <a href="${targetUrl}" class="btn" id="openBtn">ABRIR APLICACIÓN</a>
    <div class="hint">Toca los 3 puntos (⋮) de Chrome y elige <b>"Agregar a la pantalla principal"</b> para tenerla siempre.</div>
  </div>
  <script>
    setTimeout(function() {
      window.location.replace("${targetUrl}");
    }, 600);
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ColoniaSanLuis-PerlaVerde.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 2. Android Direct Native Install (WebAPK / Native Prompt)
  const installAndroidDirect = async (): Promise<{ status: string; message: string }> => {
    // If native prompt is available
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          return { status: 'installed', message: '¡Colonia San Luis instalada en tu celular!' };
        }
      } catch (err) {
        console.error('Prompt error:', err);
      }
    }

    // Always provide the standalone launcher download as a guaranteed fallback
    downloadAndroidLauncher();

    return {
      status: 'downloaded',
      message: '¡Descargado acceso directo de Android! Ábrelo para ingresar de inmediato.',
    };
  };

  // 3. Apple iOS Direct Install (Configuration Profile WebClip)
  const installAppleDirect = (): { status: 'downloaded'; message: string } => {
    const currentUrl = window.location.href;

    const mobileConfigXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>IsRemovable</key>
            <true/>
            <key>Label</key>
            <string>San Luis Perla Verde</string>
            <key>PayloadDescription</key>
            <string>Acceso directo de Colonia San Luis - Perla Verde en pantalla de inicio.</string>
            <key>PayloadDisplayName</key>
            <string>Colonia San Luis - Perla Verde</string>
            <key>PayloadIdentifier</key>
            <string>com.coloniasanluis.perlaverde.webclip</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>98E9B34A-4813-4B1C-8A95-E5874229671E</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>Precomposed</key>
            <true/>
            <key>URL</key>
            <string>${currentUrl}</string>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>Colonia San Luis - La Perla Bonita de Antioquia</string>
    <key>PayloadIdentifier</key>
    <string>com.coloniasanluis.perlaverde.profile</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>1A3E5F7B-9D12-4C34-8E56-F123456789AB</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;

    const blob = new Blob([mobileConfigXml], {
      type: 'application/x-apple-aspen-config',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ColoniaSanLuis-PerlaVerde.mobileconfig';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      status: 'downloaded',
      message: '¡Perfil descargado! Toca "Instalar" en Ajustes de iOS para colocar el icono en tu pantalla de inicio.',
    };
  };

  // 4. Windows / Mac Direct Desktop Launcher
  const installDesktopDirect = () => {
    const currentUrl = window.location.href;

    // Desktop .url shortcut (works on Windows & macOS)
    const urlShortcutContent = `[InternetShortcut]\r\nURL=${currentUrl}\r\nIconIndex=0\r\n`;
    const blob = new Blob([urlShortcutContent], { type: 'application/internet-shortcut' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ColoniaSanLuis-PerlaVerde.url';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return {
      status: 'downloaded',
      message: '¡Acceso directo de escritorio descargado con éxito!',
    };
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    platform,
    isInIframe,
    appUrl,
    downloadAndroidLauncher,
    installAndroidDirect,
    installAppleDirect,
    installDesktopDirect,
  };
}
