const iconv = require('iconv-lite')

exports.Printer= class Printer {
   command = [];

   serialport = null

  constructor({
    size,
    speed,
    gap,
    serialport
  }) {
    const command = [];
    command.push(`<ESC>!?`);
    command.push(`SET PEEL OFF`);
    command.push(`SET CUTTER OFF`);
    command.push(`SET PARTIAL_CUTTER OFF`);
    command.push(`SET TEAR ON`);
    command.push(`SET RESPONSE ON`);
    command.push(`SIZE ${size.width} mm, ${size.height} mm`);
    command.push(`GAP ${gap.x} mm,${gap.y} mm`);
    command.push(`REFERENCE 0,0`);
    command.push(`SPEED ${speed}.0`);
    command.push(`DIRECTION 0,0`);
    command.push(`SHIFT 0`);
    command.push(`OFFSET 0 mm`);
    command.push(`DENSITY 10`);
    this.command = command;
    this.serialport = serialport
    return this;
  }

  setText({
    x,
    y,
    font = 'TSS24.BF2',
    rotation = 0,
    scaleFactor = 1,
    alignment,
    content,
  }) {
    this.command.push(`TEXT 10,${y * 11.8},"${font}",${rotation},${scaleFactor},${alignment},"${content}"`);
    return this;
  }

  setQrCode({
    x,
    y,
    eccLevel,
    width,
    mode,
    rotation,
    content,
  }) {
    this.command.push(`QRCODE ${x},${y},${eccLevel},${width},${mode},${rotation}, "${content}"`);
    return this;
  }

  setBarCode({
    x,
    y,
    type = '128',
    height,
    readable,
    rotation = 0,
    narrow = 2,
    alignment = 2,
    content,
  }) {
    this.command.push(`BARCODE ${x},${y},"${type}",${height},${readable},${rotation},${narrow},${alignment},"${content}"`);
    return this;
  }

  clear() {
    this.command.push('CLS');
    return this;
  }

  sendCommand(str) {
    this.command.push(str);
    return this;
  }

  async print({ quantity = 1, count = 1 }) {
    this.command.push(`PRINT ${quantity},${count}`);
    this.command.push(`END`);
    return iconv.encode(this.command.join('\r\n'), 'gbk')
  }
  async Write(command) {
    // return this.serialport.writeValue()
  }
}