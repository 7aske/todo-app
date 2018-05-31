const electron = require('electron');
const url = require('url');
const path = require('path');

const os = require('os');

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const shortid = require('shortid');

const adapter = new FileSync(path.join(__dirname, '/public/db/notes.json'));
const db = low(adapter);


process.env.ROOTDIR = __dirname;
process.env.CURRENT_EDIT = '';
process.env.CURRENT_ID = '';
process.env.NODE_ENV = 'production';

db
	.defaults({
		notes: [
			{
				id: '',
				text: ''
			}
		]
	})
	.write();

const { app, BrowserWindow, Menu, ipcMain } = electron;

let mainWindow;

//Listen for app ///////////////////////////////////////////////
app.on('ready', () => {
	//Create a window
	mainWindow = new BrowserWindow({
		height:640,
		width:865,
		resizable: false
	});
	//Load HTML into the window
	mainWindow.loadURL(
		url.format({
			pathname: path.join(__dirname, '/window/mainWindow.html'),
			protocol: 'file:',
			slashes: true
		})
	);
	//Quit app when close
	mainWindow.on('close', () => {
		app.quit();
	});
	//Build Menu
	const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
	//Insert Menu
	Menu.setApplicationMenu(null);
});

app.once('closed', () => {
	app.quit();
});
app.on('all-windows-closed', () => {
	app.quit();
});
//Crate note edit window ///////////////////////////////////////////////
function createNoteEditWindow() {
	noteEditWindow = new BrowserWindow({
		height: 400,
		width: 400,
		resizable: false,
		frame: false
	});
	noteEditWindow.loadURL(
		url.format({
			pathname: path.join(__dirname, '/window/noteEditor.html'),
			protocol: 'file:',
			slashes: true
		})
	);
	//Garbage collection handler
	noteEditWindow.on('closed', () => {
		process.env.CURRENT_EDIT = '';
		process.env.CURRENT_ID = '';
		noteEditWindow = null;
	});
	const editMenu = Menu.buildFromTemplate(mainMenuTemplate);
	noteEditWindow.setMenu(null);
}

//Catsh data from edit window
ipcMain.on('note:save', (event, text) => {
	id = shortid.generate();
	db
		.get('notes')
		.push({
			id: id,
			text: text
		})
		.write();
	mainWindow.webContents.send('note:save', text, id);
	noteEditWindow.close();
});
ipcMain.on('note:add', event => {
	console.log(process.env.CURRENT_EDIT,process.env.CURRENT_ID);
	createNoteEditWindow();
});
ipcMain.on('note:edit', (event, data, id) => {
	process.env.CURRENT_EDIT = data;
	process.env.CURRENT_ID = id;
	createNoteEditWindow();
});
ipcMain.on('note:update', (event, data, id) => {
	db
		.get('notes')
		.find({ id: id })
		.assign({ text: data })
		.write();
	mainWindow.webContents.send('note:refresh', data, id);
	noteEditWindow.close();
});
ipcMain.on('note:remove', (event, id) => {
	db
		.get('notes')
		.remove({ id: id })
		.write();
});
ipcMain.on('note:editClose', event => {
	noteEditWindow.close();
});
//Main window menu template
const mainMenuTemplate = [
	{
		label: 'File',
		submenu: [
			{
				label: 'New note',
				accelerator: process.platform == 'darwin' ? 'Command + N' : 'Ctrl + N',
				click() {
					createNoteEditWindow();
				}
			}
		]
	}
];

//Edit window menu template
const editMenuTemplate = [
	{
		label: 'File',
		submenu: [
			{
				label: 'New note',
				accelerator: process.platform == 'darwin' ? 'Command + N' : 'Ctrl + N',
				click() {
					createNoteEditWindow();
				}
			}
		]
	}
];
//Menu fix for mac
if (process.platform == 'darwin') {
	mainMenuTemplate.unshift({});
	editMenuTemplate.unshift({});
}
if (process.env.NODE_ENV != 'production') {
	mainMenuTemplate.push({
		label: 'Dev Tools',
		submenu: [
			{
				label: 'Inspect',
				accelerator: process.platform == 'darwin' ? 'Command + I' : 'Ctrl + I',
				click(item, focusedWindow) {
					focusedWindow.toggleDevTools();
				}
			},
			{
				label: 'Reload',
				accelerator: 'F5',
				role: 'reload'
			}
		]
	});
	editMenuTemplate.push({
		label: 'Dev Tools',
		submenu: [
			{
				label: 'Inspect',
				accelerator: process.platform == 'darwin' ? 'Command + I' : 'Ctrl + I',
				click(item, focusedWindow) {
					focusedWindow.toggleDevTools();
				}
			}
		]
	});
}
