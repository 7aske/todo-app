const electron = require('electron');
const { ipcRenderer } = electron;

if ((typeof process.env.CURRENT_EDIT == 'string') && (process.env.CURRENT_EDIT != null)) {
	document.querySelector('textarea').innerText = process.env.CURRENT_EDIT;
}

document.addEventListener('keydown', (event)=> {
	if (event.key == 'Enter') {
		submitForm();
	} else if (event.key == 'Escape'){
		cancelEdit();
	}
});

function submitForm() {
	if (document.querySelector('#text').value.length <= 160) {
		var text = document.querySelector('#text').value;
		if (process.env.CURRENT_ID != ''){
			var id = process.env.CURRENT_ID;
			ipcRenderer.send('note:update', text, id);
		} else {
			ipcRenderer.send('note:save', text);
		}
	} else {
		alert('Length of the note should be less than 160 characters');
	}
}
function cancelEdit() {
	ipcRenderer.send('note:editClose');
} 
document.querySelector('#counter').innerText = 159 - parseInt(document.querySelector('#text').value.length);
document.querySelector('#text').addEventListener('keypress', ()=> {
	document.querySelector('#counter').innerText = 159 - parseInt(document.querySelector('#text').value.length);
})
