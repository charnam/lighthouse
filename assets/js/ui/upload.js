
async function uploadFile(input) {
	//file, uploadType, progress
	if(!input.fileInput)
		throw new Error("fileInput is a required argument");
	
	if(!input.uploadType)
		throw new Error("uploadType is a required argument");
	
	return new Promise(res => {
		let formData = new FormData();
		let file = input.fileInput.files[0];
		
		formData.append("uploadType", input.uploadType);
		formData.append("file", file, file.name);
		
		let upload = new XMLHttpRequest();
		
		upload.responseType = "text";
		
		if(input.progress)
			input.progress(0);
		upload.upload.addEventListener("progress", (event) => {
			if(input.progress)
				input.progress(event.loaded / event.total * 100);
		});
		upload.onload = () => {
			if(input.progress)
				input.progress(100);
			let response = JSON.parse(upload.response);
			res(response);
		}
		
		upload.open("POST", "/uploads/create", true);
		upload.send(formData)
	});
}

export default uploadFile;

