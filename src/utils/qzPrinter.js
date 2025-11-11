

// src/utils/qzPrinter.js

export async function connectPrinter() {
  if (!window.qz) {
    throw new Error('QZ Tray non détecté. Vérifie qu’il est bien installé et lancé.');
  }

  if (!window.qz.websocket.isActive()) {
    await window.qz.websocket.connect();
    console.log("✅ Connecté à QZ Tray");
  }
}

export async function listPrinters() {
  await connectPrinter();
  const printers = await window.qz.printers.find();
  console.log("🖨️ Imprimantes disponibles :", printers);
  return printers;
}

export async function printTextDirect(text, printerName = null) {
  await connectPrinter();

  if (!printerName) {
    printerName = await window.qz.printers.getDefault();
    console.log("Impression sur l’imprimante par défaut :", printerName);
  }

  const config = window.qz.configs.create(printerName);
  const data = [{ type: 'raw', format: 'plain', data: text }];

  await window.qz.print(config, data);
  console.log("🧾 Facture envoyée à l’imprimante :", printerName);
}
