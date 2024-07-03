// packageA/blueTooth/blueTooth.js
import {Printer} from '../../utils/print';
Page({

    /**
     * 页面的初始数据
     */
    data: {
        candata: false,
        value: '',
        device: {},
        sheArr: []

    },

    //搜索蓝牙
    searchBlue() {
        wx.openBluetoothAdapter({
            success: (res) => {
                console.log("初始化蓝牙适配器成功", res);
                this.startBluetoothDevicesDiscovery();
            },
            fail: (res) => {
                console.log("初始化蓝牙适配器失败", res);
            }
        });
    },

    startBluetoothDevicesDiscovery() {
        wx.startBluetoothDevicesDiscovery({
            services: [], // 可以设置为空数组
            allowDuplicatesKey: false,
            success: (res) => {
                console.log('启动搜索蓝牙设备成功', res);
            },
            fail(res) {
                console.log('启动搜索蓝牙设备失败', res);
            }
        });
    },
    getSome(deviceId) {
        wx.getBLEDeviceServices({
            //deviceId
            deviceId,
            success:async (res) => {
                //serviceIds,每个item的uuid
                console.log('设备服务:', res.services);
                const services = res.services;
                this.getDeviceCharacteristics(deviceId, services, (result) => {
                    console.log('找到的特征:', result);
                    let value = `TEXT 0,0,"TSS24.BF2",0,1,1,"是谁谁谁谁谁"`;
            
                    const print = new Printer({
                        size:{width:40,height:30},
                        speed:2,
                        gap: { x:0, y:0 },
                        serialport:null
                    });
                    print.clear().sendCommand(value).print({quantity:1,count:1}).then((values) => {
                        // console.log('values',values);
            
                        wx.writeBLECharacteristicValue({
                            deviceId,
                            serviceId:result.serviceId,
                            characteristicId:result.characteristicId,
                            value:values.buffer,
                            success: (res) => {
                                console.log('发送数据成功', res);
                            },
                            fail(res) {
                                console.log('发送数据失败', res);
                            }
                        });
                    })
                });
            },
            
            fail(res) {
                console.log('获取设备服务失败', res);
            }
        });
    },

    //连接打印机蓝牙
    connectBlue(deviceId) {
        wx.createBLEConnection({
            deviceId,
            success: (res) => {
                console.log('连接蓝牙设备成功', res);
                // 连接到设备后获取服务和特征
                this.getSome(this.data.device.deviceId);
                // 发送数据到蓝牙设备
                this.setData({
                    candata: true
                })

            },
            fail(res) {
                console.log('连接蓝牙设备失败', res);
            }
        });
    },

    /**
     * 以Promise方式调用 微信api
     * @param {string} name 微信api的名称 ，如 wxAsyncPromise("getSystemInfo",options)
     * @param {object} options 除了success 和 fail 的其他参数
     * @returns
     */
    wxAsyncPromise(name, options) {
        return new Promise((resolve, reject) => {
            wx[name]({
                ...(options || {}),
                success: function (res) {
                    resolve(res);
                },
                fail: function (res) {
                    reject(res);
                },
            });
        });
    },
    //在多个服务services中递归查找能用的特征值
    //deviceId : 已连接的蓝牙设备id
    //services : wx.getBLEDeviceServices()取得的服务
    getDeviceCharacteristics(deviceId, services = [], success, fail) {
        services = services.slice(0);
        if (services.length) {
            const serviceId = services.shift().uuid
            this.wxAsyncPromise('getBLEDeviceCharacteristics', {
                deviceId,
                serviceId,
            })
            .then((res) => {
                let finished = false;
                let write = false;
                let notify = false;
                let indicate = false;
                //有斑马品牌的一款打印机中res.characteristics的所有uuid都是相同的，
                //找所有的properties存在(notify || indicate) && write（如果只写入数据只要write=true也可以）这种情况就说明这个uuid是可用的
                //（不确保所有的打印机都能用这种方式取得uuid,
                //在凯盛诺打印机的res.characteristic只有一个uuid,所以也能用这个方式）
                for (var i = 0; i < res.characteristics.length; i++) {
                    if (!notify) {
                        notify = res.characteristics[i].properties.notify;
                    }
                    if (!indicate) {
                        indicate = res.characteristics[i].properties.indicate;
                    }
                    if (!write) {
                        write = res.characteristics[i].properties.write;
                    }
                    if ((notify || indicate) && write) {
                        /* 获取蓝牙特征值uuid */
                        success &&
                            success({
                                serviceId,
                                characteristicId: res.characteristics[i].uuid,
                            });
                        finished = true;
                        break;
                    };
                    console.log('getBLEDeviceCharacteristics', deviceId, serviceId, res);
                }

                if (!finished) {
                    getDeviceCharacteristics(deviceId, services, success, fail);
                }
            })
            .catch((res) => {
                getDeviceCharacteristics(deviceId, services, success, fail);
            });
        } else {
            fail && fail();
        }
    },
    




    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function () {
        wx.onBluetoothDeviceFound((res) => {
            console.log('新设备已找到', res.devices);
            const devices = res.devices;
            devices.forEach(device => {
                if (/^GP/.test(device.localName)) {
                    console.log('找到以"GP"开头的设备: ', device);
                    this.setData({
                        device
                    });
                    //连接打印机
                    this.connectBlue(device.deviceId);
                    // 停止搜索设备
                    wx.stopBluetoothDevicesDiscovery({
                        success: (res) => {
                            console.log('停止搜索蓝牙设备成功', res);
                        },
                        fail(res) {
                            console.log('停止搜索蓝牙设备失败', res);
                        }
                    });
                }
            });
            // 在这里处理找到的设备


        });
    },


    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    }
})