const {Printer}  = require('../../utils/print')
const app = getApp()

Page({
  data: {
      print:null,
      printConfig:{
        deviceId:'',
        serviceId:'',
        characteristicId: '',
      },
      writeState:false,
      printText:''
  },
  bindKeyInput: function (e) {
      console.log(e.detail.value)
    this.setData({
      printText: e.detail.value
    })
  },
  onLoad() {
      const that = this
        // 初始化蓝牙模块
        // 监听扫描到新设备事件
        wx.onBluetoothDeviceFound((res) => {
            res.devices.forEach((device) => {
                if(device.name === 'GP-3120TUC_F2B1'){
                    that.data.print = device
                    // 找到要搜索的设备后，及时停止扫描
                    wx.stopBluetoothDevicesDiscovery()
                    that.connect()
                }
            })
      
        })
        wx.openBluetoothAdapter({
            mode: 'central',
            success: () => {
            // 开始搜索附近的蓝牙外围设备
            wx.startBluetoothDevicesDiscovery({
                allowDuplicatesKey: false,
            })
            wx.getBluetoothDevices().then(res=>{
                console.log(res)
            })
            },
            fail: (res) => {
            if (res.errCode !== 10001) return
            wx.onBluetoothAdapterStateChange((res) => {
                if (!res.available) return
                // 开始搜寻附近的蓝牙外围设备
                wx.startBluetoothDevicesDiscovery({
                allowDuplicatesKey: false,
                })
            })
            }
        })
  },
  connect(){
    const that = this;
    wx.createBLEConnection({
        deviceId:this.data.print.deviceId, // 搜索到设备的 deviceId
        success: () => {
          // 连接成功，获取服务
          wx.getBLEDeviceServices({
            deviceId:this.data.print.deviceId,
            success(result){
                wx.getBLEDeviceServices({
                    deviceId:result.deviceId, // 搜索到设备的 deviceId
                    success: (res) => {
                      for (let i = 0; i < res.services.length; i++) {
                        if (res.services[i].isPrimary) {
                            const serviceId = res.services[i].uuid
                            wx.getBLEDeviceCharacteristics({
                                deviceId:res.deviceId, // 搜索到设备的 deviceId
                                serviceId, // 上一步中找到的某个服务
                                success: (res) => {
                                  for (let i = 0; i < res.characteristics.length; i++) {
                                    let item = res.characteristics[i]
                                    if (item.properties.write) { // 该特征值可写
                                     that.data.writeState = true
                                     that.data.printConfig = {
                                        deviceId:res.deviceId,
                                        serviceId,
                                        characteristicId: item.uuid,
                                     }
                                    }
                                  }
                                },
                                fail(){}
                              })
                        }
                      }
                    }
                  })
            }
          })
        }
      })
      
  },
  //打印服务
  print(){
      const { writeState,printConfig,printText} = this.data
      if(!writeState){
          wx.showModal({
            title: '',
            content: '蓝牙未连接',
            complete: (res) => {
            }
          })
          return
      }
    var _printer = new Printer({size:{width:40,height:30},speed:2, gap: { x:0, y:0 },
        serialport:null})
        _printer.clear()
        _printer.sendCommand(`TEXT 0,0,"TSS24.BF2",0,1,1,"${printText}"`)
        _printer.print({quantity:1,count:1}).then(buffer=>{
        wx.writeBLECharacteristicValue({
            deviceId:printConfig.deviceId,
            serviceId:printConfig.serviceId,
            characteristicId: printConfig.characteristicId,
            value:  buffer.buffer,
            success(){
                console.log('send success')
            },fail(err){
                console.log('send fail',err)
            }
        })
    })
  },
  connectBlueBooth(){},

})
