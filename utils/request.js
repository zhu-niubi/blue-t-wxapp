'use strict'
const app = getApp()
const hostUri = app.globalData.hostUri

function request(options){
	
	const userToken = wx.getStorageSync('token')
	// //console.log('xxxx',hostUri)
	return new Promise((resolve, reject) => {
	  const { url, data, method } = options
  
	  const header = { 'Content-Type': 'application/json' }
  
	  if (url && url.indexOf('http') === -1) {
		options.url = `${hostUri ? hostUri.replace(/\/$/, '') : ''}/${url.replace(
		  /^\//,
		  ''
		)}`
	  }

  
	  if (data && method !== 'GET') {
		options.data = JSON.stringify(data)
	  }

	  if (userToken) {
		header['Authorization'] = `Bearer ${userToken}`
	  } 
  
	  wx.request({
		header,
		...options,
		success(res) {
            
		  if (res.data.code === 0 || res.data.status == 200) {
			resolve(res.data)
		  } else {
            
			switch (res.statusCode) {
				case 401:
				  // 清除token本地缓存
                  wx.removeStorageSync('token')
                  
                  const page = getCurrentPages().pop();
                // //console.log(page)
                if (page.route !=='pages/index/index') {
                     wx.switchTab({
                        url: `/pages/index/index`,
                    })
                } 
				
				  break
				case 500:
				  wx.showModal({
					title: '错误提示',
					content: res.data.message,
					showCancel: false,
                  })
                  break
				default:
                   if(res.data?.code === 100){
                        resolve(res.data)
                        break
                    }
					wx.showModal({
						title: '错误提示',
						content: res.data.message,
						showCancel: false,
					  })
				  break
			  }
		  }
		},
		fail(res) {
		  //console.error('fail', res.errMsg)
		  reject(res.data)
		},
		complete() {
		  wx.hideLoading()
		},
	  })
	})
}


export { request }
