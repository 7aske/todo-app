const electron = require('electron');
const { ipcRenderer } = electron;
const path = require('path');

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const shortid = require('shortid');

const adapter = new FileSync(
	path.join(process.env.ROOTDIR, '/public/db/notes.json')
);
const db = low(adapter);

function Note(parentName, textContent, id) {
	var noteContainer = document.createElement('div');
	noteContainer.setAttribute('class', 'noteContainer');
	noteContainer.setAttribute('id', id);

	var textContainer = document.createElement('p');
	textContainer.innerText = textContent;

	var buttonEdit = document.createElement('button');
	buttonEdit.innerText = 'Edit';
	buttonEdit.addEventListener('click', editNote);

	var buttonRemove = document.createElement('button');
	buttonRemove.innerText = 'Del';
	buttonRemove.addEventListener('click', removeNote);

	noteContainer.appendChild(textContainer);
	noteContainer.appendChild(buttonEdit);
	noteContainer.appendChild(buttonRemove);

	document.querySelector('#container').appendChild(noteContainer);
}

//Render existing data
var notes = db.get('notes').__wrapped__.notes;

for (var i = 1; i < notes.length; i++) {
	Note('container', notes[i].text, notes[i].id);
}

function addNote() {
	ipcRenderer.send('note:add');
}
ipcRenderer.on('note:save', (event, data, id) => {
	Note('container', data, id);
});
ipcRenderer.on('note:refresh', (event, data, id) => {
	console.log(document.querySelector(id));
	document.querySelector('#' + id).firstChild.innerText = data;
});
function editNote(event) {
	var id = event.target.parentNode.id;
	var text = event.target.previousElementSibling.innerText;
	ipcRenderer.send('note:edit', text, id);
}
function removeNote(event) {
	var id = event.target.parentNode.id;
	event.target.parentNode.remove();
	ipcRenderer.send('note:remove', id);
}
