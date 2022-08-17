const API_KEY = 'AIzaSyBpucrwI-HMHzIEJi4ggHHHZROg1CVnhW8';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest", "https://sheets.googleapis.com/$discovery/rest?version=v4"];
let SPREADSHEET_ID;
const TAG_SHEET_GID = 464891178;
const CONTENT_SHEET_GID = 0;
const APP_FOLDER_NAME = "Eight arms to hold you";
const PROPERTY_KEY = "FluidMemory_files";
const PROPERTY_VALUE = "true";
var fluidmemory_status = [1,1,1,1]
var pinList = {}
let effectiveUser;
var CURRENT_FOLDER_ID;
chrome.browserAction.onClicked.addListener(function(tab) {
    console.log('browserAction.onClicked')
    if(localStorage.getItem("token") == "undefined" || localStorage.getItem("token") == undefined) {
        chrome.tabs.sendMessage(tab.id, "loader");
        return chrome.identity.getAuthToken({
            interactive: true
        }, function(token) {
            localStorage.setItem('token', token);
            gapi.client.init({
                // Don't pass client nor scope as these will init auth2, which we don't want
                apiKey: API_KEY,
                discoveryDocs: DISCOVERY_DOCS,
            }).then(function() {
                var request = gapi.client.request({
                    'path': 'drive/v3/files?fields=*',
                    'method': 'GET',
                    'headers': {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token,
                    },
                });
                request.execute(function(resp) {
                    console.log(resp);
                    if(resp.files != null) {
                        for(i=0;i<resp.files.length;i++) {
                            if(resp.files[i].mimeType == "application/vnd.google-apps.folder" && resp.files[i].name == "Eight arms to hold you") {
                                var properties = resp.files[i].properties;
                                if(properties != null || properties != undefined) {
                                    if(properties.key == PROPERTY_KEY && properties.value == PROPERTY_VALUE && properties.visibility == "PUBLIC") {
                                        CURRENT_FOLDER_ID = resp.files[i].id;
                                        console.log(CURRENT_FOLDER_ID);
                                    }
                                }
                            }
                        }
                    }   
                    if(CURRENT_FOLDER_ID != undefined) {
                        chrome.storage.local.set({
                            popup: false
                        }, console.log('popup state set'));
                        console.log(localStorage.getItem("token"));
                        if(localStorage.getItem("token")!="undefined") {
                            localStorage.setItem('folderID', CURRENT_FOLDER_ID);
                            chrome.tabs.reload();
                            chrome.runtime.reload();
                        }
                    } else {
                        var request = gapi.client.request({
                            'path': '/drive/v3/files/',
                            'method': 'POST',
                            'headers': {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + token,
                            },
                            'body': {
                                "properties":
                                  {
                                    "FluidMemory_files": "true"
                                  },
                                "title": APP_FOLDER_NAME,
                                "name": APP_FOLDER_NAME,
                                "mimeType": "application/vnd.google-apps.folder",
                            }
                        });
        
                        request.execute(function(resp) {
                            chrome.storage.local.set({
                                popup: false
                            }, console.log('popup state set'));
                            console.log(resp);
                            console.log(localStorage.getItem("token"));
                            if(localStorage.getItem("token")!="undefined") {
                                localStorage.setItem('folderID', resp.id);
                                chrome.tabs.reload();
                                chrome.runtime.reload();
                            }
                        })
                    }
                })
            })
        })
    } else {
        chrome.tabs.sendMessage(tab.id, "toggle");
    }
});

chrome.tabs.onActivated.addListener(function(info) {
    console.log('tabs.onActivated');
    gapi.auth.setToken({
        'access_token': localStorage.getItem('token'),
    });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status == "complete") {
        gapi.auth.setToken({
            'access_token': localStorage.getItem('token'),
        });
    }
});
function onGAPILoad() {
    console.log('onGAPILOAD')
    chrome.storage.local.get('current_sheet', function(result) {
        console.log("storage.local.get current_sheet");
        //test
        //  let SPREADSHEET_ID = '1tke5pJK1KIghVy0qYb0nBPXQisjnAdA9c7aamR2TvDs';
        //  const TAG_SHEET_GID = 39026538;
        //  const CONTENT_SHEET_GID = 149364750;
        //production
        var init = {
            method: 'GET',
            async: true,
            headers: {
                Authorization: 'Bearer ' + localStorage.getItem('token'),
                'Content-Type': 'application/json'
            },
            'contentType': 'json'
        };
        fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, init)
            .then((response) => response.json())
            .then(function(user) {
                effectiveUser = user.email;
            }).catch(error => {
                console.log(error);
                return chrome.identity.getAuthToken({
                    interactive: true
                }, function(token) {
                    localStorage.setItem('token', token);
                });
            }), !0
        if (result.current_sheet !== undefined && result.current_sheet.id !== undefined) {
            SPREADSHEET_ID = result.current_sheet.id;   
        }
        gapi.client.init({
            // Don't pass client nor scope as these will init auth2, which we don't want
            apiKey: API_KEY,
            discoveryDocs: DISCOVERY_DOCS,
        }).then(function() {
            console.log('gapi initialized');
            // chrome.tabs.reload();
            chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
                console.log("onMessage main listener part", request.contentScriptQuery);
                if (!sender) {
                    return;
                }
                switch (request.contentScriptQuery) {
                    case "getSheetInfo":
                        if(SPREADSHEET_ID === undefined) {
                            return new Date();
                        }
                        var init = {
                            method: 'GET',
                            async: true,
                            headers: {
                                Authorization: 'Bearer ' + localStorage.getItem('token'),
                                'Content-Type': 'application/json'
                            },
                            'contentType': 'json'
                        };
                        return fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=properties%2Ftitle`, init)
                            .then((response) => response.json())
                            .then(function(data) {
                                var obj = {
                                    id: SPREADSHEET_ID,
                                    title: data.properties.title
                                }
                                sendResponse(obj);
                            }).catch(error => {
                                console.log(error);
                                return chrome.identity.getAuthToken({
                                    interactive: true
                                }, function(token) {
                                    localStorage.setItem('token', token);
                                });
                            }), !0;
                    case "getUser":
                        var init = {
                            method: 'GET',
                            async: true,
                            headers: {
                                Authorization: 'Bearer ' + localStorage.getItem('token'),
                                'Content-Type': 'application/json'
                            },
                            'contentType': 'json'
                        };
                        return fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, init)
                            .then((response) => response.json())
                            .then(function(user) {
                                sendResponse(user);
                            }).catch(error => {
                                console.log(error);
                                return chrome.identity.getAuthToken({
                                    interactive: true
                                }, function(token) {
                                    localStorage.setItem('token', token);
                                });
                            }), !0
                    case "getTags":
                        console.log("GetTags");
                        console.log(SPREADSHEET_ID);
                        if(SPREADSHEET_ID === undefined) return;
                        var SPREADSHEET_TAB_NAME = 'Tags!A2:E';
                        return gapi.client.sheets.spreadsheets.values.get({
                            spreadsheetId: SPREADSHEET_ID,
                            range: SPREADSHEET_TAB_NAME,
                        }).then(function(response) {
                             sendResponse(response.result.values);
                        }).catch(error => {
                            console.log(error);
                            chrome.identity.getAuthToken({
                                interactive: true
                            }, function(token) {
                                localStorage.setItem('token', token);
                            });
                        }), !0;

                    case "recordTag":
                        if(SPREADSHEET_ID === undefined) return;
                        var body = {
                            values: [
                                [
                                    request.data.tag,
                                    request.data.color,
                                    request.data.index,
                                    request.data.miro_color,
                                    request.data.researcher,
                                    request.data.time, // Timestamp

                                ]
                            ]
                        };
                        console.log(request.data.tag+":"+request.data.color+"          "+new Date().toTimeString());
                        var SPREADSHEET_TAB_NAME = 'Tags';
                        
                        return gapi.client.sheets.spreadsheets.values.append({
                            resource: body,
                            spreadsheetId: SPREADSHEET_ID,
                            range: SPREADSHEET_TAB_NAME,
                            valueInputOption: 'USER_ENTERED',
                        }).then((response) => {
                            sendResponse({
                                success: true
                            });
                            // On success
                            console.log(`${response.result.updates.updatedCells} cells appended.`)
                        }).catch(error => {
                            console.log(error);
                            return chrome.identity.getAuthToken({
                                interactive: true
                            }, function(token) {
                                localStorage.setItem('token', token);
                            });
                        }), !0;
                    case "updateTags":
                        if(SPREADSHEET_ID === undefined) return;
                        var body = {
                            values: [
                                [
                                    request.data.tag,
                                    request.data.color,
                                    request.data.index,
                                    request.data.miro_color,
                                    request.data.researcher,
                                    request.data.time, // Timestamp

                                ]
                            ]
                        };
                        var SPREADSHEET_TAB_NAME = 'Tags!' + request.range;
                        // Append values to the spreadsheet
                        
                        return gapi.client.sheets.spreadsheets.values.update({
                            resource: body,
                            spreadsheetId: SPREADSHEET_ID,
                            range: SPREADSHEET_TAB_NAME,
                            valueInputOption: 'USER_ENTERED',
                        }).then((response) => {
                            sendResponse({
                                success: true
                            });
                        }).catch(error => {
                            console.log(error);
                            return chrome.identity.getAuthToken({
                                interactive: true
                            }, function(token) {
                                localStorage.setItem('token', token);
                            });
                        }), !0;

                    case "deleteTag":
                        if(SPREADSHEET_ID === undefined) return;
                        var row_index = request.index;
                        return gapi.client.sheets.spreadsheets.batchUpdate({
                            spreadsheetId: SPREADSHEET_ID
                        }, {
                            requests: [{
                                "deleteDimension": {
                                    "range": {
                                        "sheetId": TAG_SHEET_GID, // modify this to be your sheet gid
                                        "dimension": "ROWS",
                                        "startIndex": row_index - 1,
                                        "endIndex": row_index
                                    }
                                }
                            }]
                        }).then((response) => {
                            sendResponse({
                                success: true
                            });
                            // On success
                            console.log(`${response.result.updates.updatedCells} cells appended.`)
                            chrome.tab.reload();
                        }), !0;

                    case "getContent":
                        if(SPREADSHEET_ID === undefined) return;
                        var SPREADSHEET_TAB_NAME = 'Content!A2:K';
                        return gapi.client.sheets.spreadsheets.values.get({
                            spreadsheetId: SPREADSHEET_ID,
                            range: SPREADSHEET_TAB_NAME,
                        }).then(function(response) {
                            sendResponse(response.result.values);
                        }), !0;

                    case "recordContent":
                        if(SPREADSHEET_ID === undefined) return;
                        var body = {
                            values: [
                                [
                                    request.data.content,
                                    request.data.code,
                                    request.data.email,
                                    request.data.document,
                                    '',
                                    request.data.doc_url,
                                    request.data.range,
                                    '',
                                    '',
                                    '',
                                    request.data.time, // Timestamp
                                    'document'
                                ]
                            ]
                        };
                        var SPREADSHEET_TAB_NAME = 'Content';
                        // Append values to the spreadsheet
                        return gapi.client.sheets.spreadsheets.values.append({
                            spreadsheetId: SPREADSHEET_ID,
                            range: SPREADSHEET_TAB_NAME,
                            valueInputOption: 'USER_ENTERED',
                            resource: body
                        }).then((response) => {
                            // On success
                            console.log(`${response.result.updates.updatedCells} cells appended.`)
                            sendResponse({
                                success: true
                            });
                        }).catch(error => {
                            console.log(error);
                            return chrome.identity.getAuthToken({
                                interactive: true
                            }, function(token) {
                                localStorage.setItem('token', token);
                            });
                        }), !0;

                    case "deleteContent":
                        if(SPREADSHEET_ID === undefined) return;
                        var row_index = request.index;
                        return gapi.client.sheets.spreadsheets.batchUpdate({
                            spreadsheetId: SPREADSHEET_ID
                        }, {
                            requests: [{
                                "deleteDimension": {
                                    "range": {
                                        "sheetId": CONTENT_SHEET_GID, // modify this to be your sheet gid
                                        "dimension": "ROWS",
                                        "startIndex": row_index - 1,
                                        "endIndex": row_index
                                    }
                                }
                            }]
                        }).then((response) => {
                            sendResponse({
                                success: true
                            });
                            // On success
                            console.log(`${response.result.updates.updatedCells} cells appended.`)
                        }), !0;
                    case "getLibrary":
                        if(SPREADSHEET_ID === undefined) return;
                        var SPREADSHEET_TAB_NAME = 'Keyword libraries';
                        return gapi.client.sheets.spreadsheets.values.get({
                            majorDimension: 'COLUMNS',
                            spreadsheetId: SPREADSHEET_ID,
                            range: SPREADSHEET_TAB_NAME,
                        }).then(function(response) {
                            sendResponse(response.result.values);
                        }).catch(error => {
                            console.log(error);
                            return chrome.identity.getAuthToken({
                                interactive: true
                            }, function(token) {
                                localStorage.setItem('token', token);
                            });
                        }), !0;
                    case "createNewSheet":
                        let conf = {
                            properties: {
                                title: request.title
                            },
                            sheets: [{

                                    properties: {

                                        "sheetId": 0,
                                        "title": 'Content',
                                        "index": 1,


                                    },
                                    data: [{
                                            "startRow": 0, // 1st row
                                            "startColumn": 0, // column A
                                            "rowData": [{
                                                "values": [{
                                                    "userEnteredValue": {
                                                        "stringValue": "Text"
                                                    }
                                                }]
                                            }]
                                        },
                                        {
                                            "startRow": 0, // 1st row
                                            "startColumn": 1, // column B
                                            "rowData": [{
                                                "values": [{
                                                    "userEnteredValue": {
                                                        "stringValue": "Code"
                                                    }
                                                }]
                                            }]
                                        },
                                        {
                                            "startRow": 0, // 1st row
                                            "startColumn": 2, // column C
                                            "rowData": [{
                                                "values": [{
                                                    "userEnteredValue": {
                                                        "stringValue": "Researcher"
                                                    }
                                                }]
                                            }]
                                        },
                                        {
                                            "startRow": 0, // 1st row
                                            "startColumn": 3, // column D
                                            "rowData": [{
                                                "values": [{
                                                    "userEnteredValue": {
                                                        "stringValue": "Document"
                                                    }
                                                }]
                                            }]
                                        },
                                        {
                                            "startRow": 0, // 1st row
                                            "startColumn": 4, // column E
                                            "rowData": [{
                                                "values": [{
                                                    "userEnteredValue": {
                                                        "stringValue": "Doc ID"
                                                    }
                                                }]
                                            }]
                                        },
                                        {
                                            "startRow": 0, // 1st row
                                            "startColumn": 5, // column F
                                            "rowData": [{
                                                "values": [{
                                                    "userEnteredValue": {
                                                        "stringValue": "Doc URL"
                                                    }
                                                }]
                                            }]
                                        },
                                        {
                                            "startRow": 0, // 1st row
                                            "startColumn": 6, // column G
                                            "rowData": [{
                                                "values": [{
                                                    "userEnteredValue": {
                                                        "stringValue": "Range reference"
                                                    }
                                                }]
                                            }]
                                        },
                                        {
                                            "startRow": 0, // 1st row
                                            "startColumn": 7, // column H
                                            "rowData": [{
                                                "values": [{
                                                    "userEnteredValue": {
                                                        "stringValue": "Bookmark ID / Cell"
                                                    }
                                                }]
                                            }]
                                        },
                                        {
                                            "startRow": 0, // 1st row
                                            "startColumn": 8, // column I
                                            "rowData": [{
                                                "values": [{
                                                    "userEnteredValue": {
                                                        "stringValue": "Content URL"
                                                    }
                                                }]
                                            }]
                                        },
                                        {
                                            "startRow": 0, // 1st row
                                            "startColumn": 9, // column J
                                            "rowData": [{
                                                "values": [{
                                                    "userEnteredValue": {
                                                        "stringValue": "Content ID"
                                                    }
                                                }]
                                            }]
                                        },
                                        {
                                            "startRow": 0, // 1st row
                                            "startColumn": 10, // column K
                                            "rowData": [{
                                                "values": [{
                                                    "userEnteredValue": {
                                                        "stringValue": "Timestamp"
                                                    }
                                                }]
                                            }]
                                        },
                                        {
                                            "startRow": 0, // 1st row
                                            "startColumn": 11, // column L
                                            "rowData": [{
                                                "values": [{
                                                    "userEnteredValue": {
                                                        "stringValue": "Source"
                                                    }
                                                }]
                                            }]
                                        }
                                    ],
                                    basicFilter: {
                                        "range": {
                                            "sheetId": 0,
                                            "startRowIndex": 0,
                                            "startColumnIndex": 0,
                                            "endColumnIndex": 12
                                        }
                                    }

                                },
                                {
                                    properties: {

                                        "sheetId": 464891178,
                                        "title": 'Tags',
                                        "index": 2,


                                    },
                                    data: [{
                                            "startRow": 0, // 1st row
                                            "startColumn": 0, // column A
                                            "rowData": [{
                                                "values": [{
                                                    "userEnteredValue": {
                                                        "stringValue": "Tags"
                                                    }
                                                }]
                                            }]
                                        },
                                        {
                                            "startRow": 0, // 1st row
                                            "startColumn": 1, // column B
                                            "rowData": [{
                                                "values": [{
                                                    "userEnteredValue": {
                                                        "stringValue": "Color"
                                                    }
                                                }]
                                            }]
                                        },
                                        {
                                            "startRow": 0, // 1st row
                                            "startColumn": 2, // column C
                                            "rowData": [{
                                                "values": [{
                                                    "userEnteredValue": {
                                                        "stringValue": "Index"
                                                    }
                                                }]
                                            }]
                                        },
                                        {
                                            "startRow": 0, // 1st row
                                            "startColumn": 3, // column D
                                            "rowData": [{
                                                "values": [{
                                                    "userEnteredValue": {
                                                        "stringValue": "Miro color"
                                                    }
                                                }]
                                            }]
                                        },
                                        {
                                            "startRow": 0, // 1st row
                                            "startColumn": 4, // column E
                                            "rowData": [{
                                                "values": [{
                                                    "userEnteredValue": {
                                                        "stringValue": "Researcher"
                                                    }
                                                }]
                                            }]
                                        },
                                        {
                                            "startRow": 0, // 1st row
                                            "startColumn": 5, // column F
                                            "rowData": [{
                                                "values": [{
                                                    "userEnteredValue": {
                                                        "stringValue": "Timestamp"
                                                    }
                                                }]
                                            }]
                                        }
                                    ],
                                    basicFilter: {
                                        "range": {
                                            "sheetId": 464891178,
                                            "startRowIndex": 0,
                                            "startColumnIndex": 0,
                                            "endColumnIndex": 6
                                        }
                                    }
                                },
                                {
                                    properties: {
                                        "sheetId": 1169863938,
                                        "title": 'Keyword libraries',
                                        "index": 3,
                                    }
                                },
                            ]
                        };
                        return gapi.client.sheets.spreadsheets.create(conf).then((response) => {
                            result = JSON.parse(response.body);
                            console.log(result.spreadsheetId);
                            let fileID = result.spreadsheetId;
                            var request = gapi.client.request({
                                'path': `/drive/v3/files/${fileID}?addParents=${localStorage.getItem('folderID')}`,
                                'method': 'PATCH',
                                'headers': {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                                },
                                'body': {
                                    "properties": 
                                    {
                                        "FluidMemory_files": "true"
                                    },
                                }
                            });
                            console.log(request);
                            request.execute(function(resp) {
                                console.log(resp);
                                if (resp !== undefined || resp !== null) {
                                    sendResponse({
                                        success: true,
                                        response: resp
                                    });
                                }
                            })
                        }).catch(error => {
                            console.log(error);
                            return;
                        }), !0;
                        
                    case "createFolder":
                        var request = gapi.client.request({
                            'path': '/drive/v3/files/',
                            'method': 'POST',
                            'headers': {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                            },
                            'body': {
                                "title": "Eight arms to hold you",
                                "mimeType": "application/vnd.google-apps.folder",
                            }
                        });

                        return request.execute(function(resp) {
                            console.log(resp);
                            sendResponse(resp);
                        }), !0;
                        
                    case "getKeyShortcut":
                        var res = { keyShortcut : keyShortcut}
                        
                        sendResponse({
                            success: true,
                            response: res
                        });
                        return false

                    case "getDriveFiles":
                        var request = gapi.client.request({
                            'path': `/drive/v2/files?q=mimeType = 'application/vnd.google-apps.spreadsheet' and (properties has { key='FluidMemory_files' and value='true' and visibility = 'PUBLIC' } or properties has { key='FluidMemory_files' and value='true' and visibility = 'PRIVATE' }) and ('`+effectiveUser+`' in writers or '`+effectiveUser+`' in owners)`,
                            'method': 'GET',
                            'headers': {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + localStorage.getItem('token'),
                            },
                            'body': {
                                mimeType: "application/vnd.google-apps.spreadsheet",
                            }
                        });

                        return request.execute(function(resp) {
                            console.log(resp);
                            resp['current_sheet_id'] = SPREADSHEET_ID;
                            sendResponse(resp);
                        }), !0;
                    case "reload":
                        return chrome.runtime.reload(), !0;
                    case "reloadTab":
                        return chrome.tabs.reload(sender.tabId), !0;
                    case "changeSheet":
                        var body = {
                            values: [
                                [
                                    request.data.id,
                                    request.data.name
                                ]
                            ]
                        };
                        SPREADSHEET_ID = body.values[0][0];
                        return;
                    case "newSheet":
                        var body = {
                            values: [
                                [
                                    request.data.id,
                                    request.data.name
                                ]
                            ]
                        };
                        SPREADSHEET_ID = body.values[0][0];
                        return;

                    case "status-mural-icon":
                        fluidmemory_status[1] = (fluidmemory_status[1]+1)%2
                        sendResponse({
                            success: true,
                            response: fluidmemory_status
                        });
                        return fluidmemory_status;
                        
                    case "status-miro-icon":
                        fluidmemory_status[2] = (fluidmemory_status[2]+1)%2
                        sendResponse({
                            success: true,
                            response: fluidmemory_status
                        });
                        return fluidmemory_status;

                    case "status-trello-icon":
                        fluidmemory_status[3] = (fluidmemory_status[3]+1)%2
                        sendResponse({
                            success: true,
                            response: fluidmemory_status
                        });
                        return fluidmemory_status;
                    
                    case "get-status":
                        sendResponse({
                            success: true,
                            response: fluidmemory_status
                        });
                        return;

                    case "status-remain-across":
                        fluidmemory_status[0] = (fluidmemory_status[0]+1)%2
                        sendResponse({
                            success: true,
                            response: fluidmemory_status
                        });
                        return;

                    case "add-pin-tag":
                        temp = []
                        if(pinList[SPREADSHEET_ID] == undefined) temp = pinList[SPREADSHEET_ID] = []
                        else temp = pinList[SPREADSHEET_ID]

                        temp.push(request.tagname)
                        pinList[SPREADSHEET_ID] = temp
                        sendResponse({ success: true, response: pinList[SPREADSHEET_ID]});
                        return;

                    case "remove-pin-tag":
                        temp = []
                        if(pinList[SPREADSHEET_ID] == undefined) temp = pinList[SPREADSHEET_ID] = []
                        else temp = pinList[SPREADSHEET_ID]

                        var index = temp.indexOf(request.tagname)
                        if (index != -1) {
                            temp.splice(index, 1)
                        }
                        pinList[SPREADSHEET_ID] = temp
                        sendResponse({ success: true, response: pinList[SPREADSHEET_ID]});
                        return;

                    case "check-pin-tag":
                        temp = []
                        if(pinList[SPREADSHEET_ID] == undefined) temp = pinList[SPREADSHEET_ID] = []
                        else temp = pinList[SPREADSHEET_ID]

                        if(temp.indexOf(request.tagname)==-1) sendResponse({success: true,response: false});
                        else sendResponse({ success: true, response: true });

                        return

                    case 'sign-out':
                        CURRENT_FOLDER_ID = undefined
                        return chrome.identity.getAuthToken({
                            interactive: true
                        }, function(token) {
                            localStorage.setItem('token', token);
                            gapi.client.init({
                                // Don't pass client nor scope as these will init auth2, which we don't want
                                apiKey: API_KEY,
                                discoveryDocs: DISCOVERY_DOCS,
                            }).then(function() {
                                var request = gapi.client.request({
                                    'path': 'drive/v3/files?fields=*',
                                    'method': 'GET',
                                    'headers': {
                                        'Content-Type': 'application/json',
                                        'Authorization': 'Bearer ' + token,
                                    },
                                });
                                request.execute(function(resp) {
                                    console.log(resp);
                                    if(resp.files != null) {
                                        for(i=0;i<resp.files.length;i++) {
                                            if(resp.files[i].mimeType == "application/vnd.google-apps.folder" && resp.files[i].name == "Eight arms to hold you") {
                                                var properties = resp.files[i].properties;
                                                if(properties != null || properties != undefined) {
                                                    if(properties.key == PROPERTY_KEY && properties.value == PROPERTY_VALUE && properties.visibility == "PUBLIC") {
                                                        CURRENT_FOLDER_ID = resp.files[i].id;
                                                        console.log(CURRENT_FOLDER_ID);
                                                    }
                                                }
                                            }
                                        }
                                    }   
                                    if(CURRENT_FOLDER_ID != undefined) {
                                        chrome.storage.local.set({
                                            popup: false
                                        }, console.log('popup state set'));
                                        console.log(localStorage.getItem("token"));
                                        if(localStorage.getItem("token")!="undefined") {
                                            localStorage.setItem('folderID', CURRENT_FOLDER_ID);
                                            chrome.tabs.reload();
                                            chrome.runtime.reload();
                                        }
                                    } else {
                                        var request = gapi.client.request({
                                            'path': '/drive/v3/files/',
                                            'method': 'POST',
                                            'headers': {
                                                'Content-Type': 'application/json',
                                                'Authorization': 'Bearer ' + token,
                                            },
                                            'body': {
                                                "properties":
                                                  {
                                                    "FluidMemory_files": "true"
                                                  },
                                                "title": APP_FOLDER_NAME,
                                                "name": APP_FOLDER_NAME,
                                                "mimeType": "application/vnd.google-apps.folder",
                                            }
                                        });
                        
                                        request.execute(function(resp) {
                                            chrome.storage.local.set({
                                                popup: false
                                            }, console.log('popup state set'));
                                            console.log(resp);
                                            console.log(localStorage.getItem("token"));
                                            if(localStorage.getItem("token")!="undefined") {
                                                localStorage.setItem('folderID', resp.id);
                                                chrome.tabs.reload();
                                                chrome.runtime.reload();
                                            }
                                        })
                                    }
                                })
                            })
                        })
                }    

                return true;
            });
        }, function(error) {
            console.log('error', error)
        });
    });
}