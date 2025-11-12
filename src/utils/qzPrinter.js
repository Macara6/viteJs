// src/utils/qzPrinter.js
export async function connectPrinter() {
  if (!window.qz) throw new Error('QZ Tray non détecté.');
  if (!window.qz.websocket.isActive()) await window.qz.websocket.connect();
}

export async function listPrinters() {
  await connectPrinter();
  return await window.qz.printers.find();
}

export async function printTest(printerName = null, text = "🔹 Test d'impression QZ Tray") {
  await connectPrinter();
  if (!printerName) printerName = await window.qz.printers.getDefault();
  const config = window.qz.configs.create(printerName);
  const data = [{ type: 'raw', format: 'plain', data: text }];
  await window.qz.print(config, data);
}
