chrome.tabs.onUpdated.addListener(updateActiveTab);
chrome.tabs.onCreated.addListener(updateActiveTab);
chrome.tabs.onActivated.addListener(updateActiveTab);
chrome.windows.onFocusChanged.addListener(updateActiveTab);

// listen for clicks on browser extension icon
chrome.browserAction.onClicked.addListener(togglePreview);

chrome.runtime.onMessage.addListener((request, sender) => {
	if (request.type === 'toggle') {
		togglePreview(sender.tab);
	} else if (request.type === 'back') {
		clearPreview(sender.tab);
	}
});

function updateActiveTab() {
	chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
		if (tabs[0]) {
			const tab = tabs[0];
			if (isProtocolSupported(tab.url)) {
				chrome.browserAction.enable(tab.id);
				chrome.permissions.contains({
					permissions: ['tabs'],
					origins: [tab.url]
				}, (allowed) => {
					if (allowed) {
						chrome.tabs.executeScript(tab.id, {
							file: './content/tab_info.js'
						}, (response) => {
							// consider using different icons for each platform
							// we now have response.platform strings 'writeas' | 'snapas'
							updateIcon(tab.id, response.active);
						});
					}
				});
			} else {
				chrome.browserAction.disable(tab.id);
				chrome.browserAction.setTitle({
					title: 'No Preview Available',
					tabId: tab.id
				});
				chrome.browserAction.setIcon({
					path: {
						19: "icons/black-trans-19.png",
						38: "icons/black-trans-38.png"
					},
					tabId: tab.id
				});
			}
		}
	});
};

function isProtocolSupported(urlString) {
	// Dropped 'file:' as should never be needed
	const supportedProtocols = ["https:", "https:"];
	let url = document.createElement('a');
	url.href = urlString;
	return supportedProtocols.indexOf(url.protocol) !== -1;
};

function togglePreview(tab) {
	chrome.permissions.request({
		permissions: ['tabs'],
		origins: [tab.url]
	})
	// get current tab status
	chrome.tabs.executeScript(tab.id, {
		file: './content/tab_info.js'
	}, (response) => {
		const page = response[0];
		if (page.supported) {
			if (page.active) {
				// clear preview
				chrome.tabs.executeScript(tab.id, {
					file: './content/clear.js'
				});
				updateIcon(tab.id, false)
			} else {
				// show preview
				chrome.tabs.executeScript(tab.id, {
					file: (page.platform === 'writeas')
					? './content/writeas.js'
					: './content/snapas.js'
				});
				updateIcon(tab.id, true)
			}
		}
	});
};

function clearPreview(tab) {
	chrome.permissions.request({
		permissions: ['tabs'],
		origins: [tab.url]
	})
	// get current tab status
	chrome.tabs.executeScript(tab.id, {
		file: './content/tab_info.js'
	}, (response) => {
		const page = response[0];
		if (page.supported) {
			if (page.active) {
				// clear preview
				chrome.tabs.executeScript(tab.id, {
					file: './content/clear.js'
				});
			}
		}
	});
};

function updateIcon(tabId, previewActive) {
	chrome.browserAction.setIcon({
		path: previewActive ? {
			19: "icons/white-trans-19.png",
			38: "icons/white-trans-38.png"
		} : {
			19: "icons/black-trans-19.png",
			38: "icons/black-trans-38.png"
		},
		tabId: tabId
	});
	chrome.browserAction.setTitle({
		title: previewActive ? 'Hide Preview' : 'Show Preview',
		tabId: tabId
	});
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.type === 'markdown_request') {
		const endpoint = 'https://pencil.writefree.ly/api/generate/markdownify';
		const params = {
			body: JSON.stringify(request.data),
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			}
		};
		fetch(endpoint, params).then((response) => {
			return response.text().then((text) => {
				sendResponse([{
					body: text,
					status: response.status,
					statusText: response.statusText,
				}, null]);
			});
		}, (error) => {
			sendResponse([null, error]);
		});
	}
	return true;
});
