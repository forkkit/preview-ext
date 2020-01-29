(async () => {
	const content = document.querySelector('textarea#caption-body').value;
	// send message
	// const data = {
	// 	type: 'markdown_reqeust',
	// 	endpoint: 'https://pencil.writefree.ly/api/markdown',
	// 	base_url: '',
	// 	raw_body: content
	// };

	// async function getBody() {
	// 	return new Promise((resolve, reject) => {
	// 		chrome.runtime.sendMessage(data, (msgResponse) => {
	// 			console.log('sending markdown request');
	// 			const [response, error] = msgResponse;
	// 			if (response === null) {
	// 				reject(error);
	// 			} else {
	// 				const body = response.body ? new Blob([response.body]) : undefined;
	// 				resolve(new Response(body, {
	// 					status: response.status,
	// 					statusText: response.statusText,
	// 				}));
	// 			}
	// 		});
	// 	});
	// };

	// const body = await getBody().then((res) => {
	// 	return res.json();
	// });
	// // TODO: handle errors
	// // maybe needs to be async/promise
	// // renderPreview(body);
	// console.log(body);
	renderPreview(content);
})();

function renderPreview(body) {
	console.log(body);
}
