!function(){'use strict'

	// /public_html
	// /Users/krose/Desktop/test

	// Modules
	const ftp = require('ftp')
	const fs = require('fs-extra')

	// DOM
	const ftpForm = document.querySelector('.ftpForm')
	const formInput = document.querySelectorAll('input')
	const statusEl = document.querySelector('.status')

	// Config
	let config = localStorage.config
	if(!config){
		config = {}
		saveConfig()
	}
	else{
		config = JSON.parse(config)
	}
	console.log('Current config:')
	console.log(config)

	// Save config to localstorage
	function saveConfig(){
		console.log(config)
		localStorage.config = JSON.stringify(config)
	}
	// Change config to input values
	function changeConfig(){
		let i
		for(i = formInput.length; i--;){
			if(formInput[i].id){
				if(formInput[i].getAttribute('type') === 'checkbox'){
					config[formInput[i].id] = formInput[i].checked ? true : false
				}
				else{
					config[formInput[i].id] = formInput[i].value
				}
			}
		}
		saveConfig()
	}
	// Change input values to config
	function changeInput(){
		let i
		let el
		for(i in config){
			el = document.querySelector(`#${i}`)
			if(el){
				if(typeof config[i] !== 'boolean'){
					el.value = config[i]
				}
				else if(config[i]){
					el.checked = true
				}
				else{
					el.checked = false
				}
			}
		}
	}
	changeInput()


	// Input events
	let i
	for(i = formInput.length; i--;){
		formInput[i].addEventListener('keyup', changeConfig)
		formInput[i].addEventListener('click', changeConfig)
		formInput[i].addEventListener('changed', changeConfig)
	}



	// Drag and drop
	window.ondragover = prevent
	window.ondrop = prevent
	function prevent(e){
		e.preventDefault()
		return false
	}
	document.body.ondrop = function (e) {
		e.preventDefault()
		let i
		let files = []
		for (i = 0; i < e.dataTransfer.files.length; ++i) {
			files.push(e.dataTransfer.files[i].path)
		}
		uploadFiles(files)
		status('Moving files...')
		moveFiles(files)
		return false
	}

	function uploadFiles(list){
		status('Uploading files...')
		const c = new ftp()
		c.on('ready', function(){
			let prog = 0

			status('FTP ready...')


			function upload(){
				if(prog >= list.length){
					c.end()
					return status('Done uploading!')
				}
				let fileName = list[prog].split('/').pop()
				c.put(list[prog], `${config.path}/${fileName}`, err => {
					if(err) errorStatus(err)
					status('Uploaded file: ' + fileName)
					prog++
					upload()
				})
			}
			upload()
		})

		c.connect({
			host: config.host,
			user: config.user,
			password: config.pass,
			secure: config.secure
		})
	}
	function moveFiles(list, prog){
		if(!prog) prog = 0
		if(prog >= list.length || !config.localPath){
			return status('Done moving files!')
		}
		let fileName = list[prog].split('/').pop()
		fs.copy(list[prog], `${config.localPath}/${fileName}`, err => {
			if(err) errorStatus(err)
			if(config.localPathB){
				fs.copy(list[prog], `${config.localPath}/${fileName}`, err => {
					if(err) errorStatus(err)
					progress()
				})
			}
			else{
				progress()
			}
		})
		function progress(){
			status('Moved file: ' + fileName)
			prog++
			moveFiles(list, prog)
		}
	}


	// Status/error handling
	function status(msg){
		console.log(msg)
		let el = document.createElement('div')
		el.classList.add('msg')
		el.textContent = msg
		statusEl.appendChild(el)
		statusEl.scrollTop = statusEl.scrollHeight
	}
	function errorStatus(msg){
		console.error(msg)
		let el = document.createElement('div')
		el.classList.add('err')
		el.textContent = msg
		statusEl.appendChild(el)
		statusEl.scrollTop = statusEl.scrollHeight
	}




}()