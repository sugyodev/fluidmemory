const shadowWrapper_popup = document.createElement('div');
shadowWrapper_popup.id = "shadow-wrapper-popup-eathu";
shadowWrapper_popup.style = "position: fixed;top: 0;right: 0;z-index:999999999;width:350px;height:100%;";
document.body.appendChild(shadowWrapper_popup);
const host_popup = document.getElementById('shadow-wrapper-popup-eathu');
const shadowRootPopup = host_popup.attachShadow({
    mode: 'open'
});

function appendStyles() {
    var link = document.createElement('link');
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL('assets/css/material-icons.css');
    document.head.appendChild(link);
}

document.addEventListener("keydown", function(event) {
    if (event.ctrlKey && event.code === "KeyQ") {
        console.log('keyQ')
        navigator.clipboard.readText()
        .then(text => {
            //console.log('Pasted content: ', text);
            navigator.clipboard.writeText("1\r2\r");
        })
    }

    if (event.ctrlKey && event.code === "KeyC") {
        selectedTr = shadowRootPopup.querySelectorAll('.row-selected')
        var clip = ``
        for(i=0; i<selectedTr.length; i++) {
            clip += (selectedTr[i].children[0].innerText+"<br>")
            clip += ("Code: #"+selectedTr[i].getAttribute('code')+"<br>")
            clip += ("Author: "+selectedTr[i].getAttribute('arthor')+"<br>")
            clip += ("Source: "+selectedTr[i].getAttribute('source')+"<br>")
            clip += ("Datasheet: "+selectedTr[i].getAttribute('datasheet')+"<br>")
            if(i!=selectedTr.length-1) {
                clip += '\t'
            }
        }
        if(clip != ``) {
            navigator.clipboard.writeText(clip)
        }
    }

    if (event.altKey && event.code === "KeyX")
    {
        if(kbshortcutmode == false) {
            chrome.runtime.sendMessage({
                contentScriptQuery: "getUser"
            }, function(user) {
                console.log(user);
                chrome.runtime.sendMessage({
                    contentScriptQuery: "getTags",
                }, function(tags) {
                    var isnon = 0;
                    var nocolor;
                    if(tags != undefined) {
                        for(i=0;i<tags.length;i++) {
                            if(tags[i][0] == 'not categorized') {
                                nocolor = tags[i][1];
                                isnon = 1;
                            }
                        }
                    }
                    if(isnon == 0) {
                        const index = tags === null ? 1 : tags.length + 1;
                        var color = random_rgba();
                        var output_tags = {
                            tag: 'not categorized',
                            color: color,
                            index: index,
                            miro_color: BACKGROUND_COLORS[index%BACKGROUND_COLORS.length],
                            researcher: user.email,
                            time: moment().format('MM/DD/YYYY HH:mm:ss')
                        }
                        element = [output_tags.tag, output_tags.color, output_tags.index, output_tags.miro_color, output_tags.researcher, output_tags.time];
                        console.log(element);
                        chrome.runtime.sendMessage({
                            contentScriptQuery: "recordTag",
                            data: output_tags,
                        }, function(response) {
                            console.log("Tag recorded!");
                            var search_input = shadowRootPopup.getElementById('search_tag');
                            search_input.value = '';
                            var ke2 = document.createEvent("KeyboardEvent");
                            ke2.initKeyboardEvent("keyup", true, true, window, "U+0008", 0, ""); //back space keypup event
                            search_input.dispatchEvent(ke2);
                            generateTagUI(element, index+1);
                            generateTagUI1(element, index+1);
                            
                            var tag_name = this.title;
                            var s_range;
                            if(window.location.href.match(/\.pdf$/)) {
                                var pageIndex = PDFViewerApplication.pdfViewer.currentPageNumber - 1; 
                                var page = PDFViewerApplication.pdfViewer.getPageView(pageIndex);
                                var pageRect = page.canvas.getClientRects()[0];
                                var selectionRects = window.getSelection().getRangeAt(0).getClientRects();
                                var selectionRectList = [];
                                i=0;
                                while(1) {
                                    if(selectionRects[i+1]==undefined) {
                                        selectionRectList.push(selectionRects[i]);
                                        break;
                                    }
                                    if(selectionRects[i].x == selectionRects[i+1].x && selectionRects[i].width == selectionRects[i+1].width) {
                                        selectionRects[i] = compare(selectionRects[i], selectionRects[i+1]);
                                        selectionRects[i+1] = compare(selectionRects[i], selectionRects[i+1]);
                                        selectionRectList.push(selectionRects[i]);
                                        i++;
                                    } else {
                                        selectionRectList.push(selectionRects[i]);
                                    }
                                    i++;
                                }
                                var viewport = page.viewport;
                                var selected = [];
                                for(i=0;i<selectionRectList.length;i++) {
                                    r = selectionRectList[i];
                                    try {
                                    selected.push(viewport.convertToPdfPoint(r.left - pageRect.x, r.top - pageRect.y).concat(
                                        viewport.convertToPdfPoint(r.right - pageRect.x, r.bottom - pageRect.y))); 
                                    } catch(e) { }
                                }
                                // var selected = selectionRects.map(function (r) {
                                //   viewport.convertToPdfPoint(r.left - pageRect.x, r.top - pageRect.y).concat(
                                //      viewport.convertToPdfPoint(r.right - pageRect.x, r.bottom - pageRect.y)); 
                                // });
                                s_range = { page: pageIndex, coords: selected };
                            } else {
                                var range = window.getSelection().getRangeAt(0);
                                var preSelectionRange = range.cloneRange();
                                preSelectionRange.selectNodeContents(document);
                                preSelectionRange.setEnd(range.startContainer, range.startOffset);
                                var start = preSelectionRange.toString().length;
                                s_range = {
                                    start: start,
                                    end: start + range.toString().length
                                };
                            }
                            var output = {
                                content: window.getSelection().toString(),
                                code: 'not categorized',
                                document: document.title,
                                doc_url:   (window.location.href.match(/\.pdf$/) === null) ? window.location.href : window.location.href.replace("chrome-extension://nbimgbgchmccioidaopfhokkongfhkoe/",""),
                                email: user.email,
                                range: JSON.stringify(s_range),
                                time: moment().format('MM/DD/YYYY HH:mm:ss')
                            }

                            chrome.runtime.sendMessage({
                                    contentScriptQuery: "recordContent",
                                    data: output,
                                    method: 'POST'
                            }, function(result) {
                                if (result.success) {
                                    var kbshortcutdiv = shadowRootPopup.getElementById('kbshortcutdiv')
                                    $(kbshortcutdiv).hide()
                                    markText(output.content, color, s_range);
                                    chrome.runtime.sendMessage({
                                        contentScriptQuery: "getTags",
                                    }, function(result) {
                                        load_navigator()
                                        if (result !== undefined) {
                                            shadowRootPopup.getElementById('search-results').innerHTML = '';
                                            shadowRootPopup.getElementById('spinner').style = "display: none;";
                                            result.forEach(element => {
                                                searchResultContents(element);
                                            })
                                        } else {
                                            shadowRootPopup.getElementById('spinner').innerHTML = '<h5> Something is wrong. Please try again by refreshing the page.</h5>';
                                        }
                                    });
                                }
                            })
                            shadowRootPopup.getElementById('no-tags-message').style.display = 'none';
                        });
                    } else if(isnon == 1) {
                        var tag_name = this.title;
                            var s_range;
                            if(window.location.href.match(/\.pdf$/)) {
                                var pageIndex = PDFViewerApplication.pdfViewer.currentPageNumber - 1; 
                                var page = PDFViewerApplication.pdfViewer.getPageView(pageIndex);
                                var pageRect = page.canvas.getClientRects()[0];
                                var selectionRects = window.getSelection().getRangeAt(0).getClientRects();
                                var selectionRectList = [];
                                i=0;
                                while(1) {
                                    if(selectionRects[i+1]==undefined) {
                                        selectionRectList.push(selectionRects[i]);
                                        break;
                                    }
                                    if(selectionRects[i].x == selectionRects[i+1].x && selectionRects[i].width == selectionRects[i+1].width) {
                                        selectionRects[i] = compare(selectionRects[i], selectionRects[i+1]);
                                        selectionRects[i+1] = compare(selectionRects[i], selectionRects[i+1]);
                                        selectionRectList.push(selectionRects[i]);
                                        i++;
                                    } else {
                                        selectionRectList.push(selectionRects[i]);
                                    }
                                    i++;
                                }
                                var viewport = page.viewport;
                                var selected = [];
                                for(i=0;i<selectionRectList.length;i++) {
                                    r = selectionRectList[i];
                                    try {
                                    selected.push(viewport.convertToPdfPoint(r.left - pageRect.x, r.top - pageRect.y).concat(
                                        viewport.convertToPdfPoint(r.right - pageRect.x, r.bottom - pageRect.y))); 
                                    } catch(e) { }
                                }
                                // var selected = selectionRects.map(function (r) {
                                //   viewport.convertToPdfPoint(r.left - pageRect.x, r.top - pageRect.y).concat(
                                //      viewport.convertToPdfPoint(r.right - pageRect.x, r.bottom - pageRect.y)); 
                                // });
                                s_range = { page: pageIndex, coords: selected };
                            } else {
                                var range = window.getSelection().getRangeAt(0);
                                var preSelectionRange = range.cloneRange();
                                preSelectionRange.selectNodeContents(document);
                                preSelectionRange.setEnd(range.startContainer, range.startOffset);
                                var start = preSelectionRange.toString().length;
                                s_range = {
                                    start: start,
                                    end: start + range.toString().length
                                };
                            }
                            var output = {
                                content: window.getSelection().toString(),
                                code: 'not categorized',
                                document: document.title,
                                doc_url:   (window.location.href.match(/\.pdf$/) === null) ? window.location.href : window.location.href.replace("chrome-extension://nbimgbgchmccioidaopfhokkongfhkoe/",""),
                                email: user.email,
                                range: JSON.stringify(s_range),
                                time: moment().format('MM/DD/YYYY HH:mm:ss')
                            }

                            chrome.runtime.sendMessage({
                                    contentScriptQuery: "recordContent",
                                    data: output,
                                    method: 'POST'
                            }, function(result) {
                                if (result.success) {
                                    load_navigator()
                                    var kbshortcutdiv = shadowRootPopup.getElementById('kbshortcutdiv')
                                    $(kbshortcutdiv).hide()
                                    markText(output.content, nocolor, s_range);
                                    chrome.runtime.sendMessage({
                                        contentScriptQuery: "getTags",
                                    }, function(result) {
                                        if (result !== undefined) {
                                            shadowRootPopup.getElementById('search-results').innerHTML = '';
                                            shadowRootPopup.getElementById('spinner').style = "display: none;";
                                            result.forEach(element => {
                                                searchResultContents(element);
                                            })
                                        } else {
                                            shadowRootPopup.getElementById('spinner').innerHTML = '<h5> Something is wrong. Please try again by refreshing the page.</h5>';
                                        }
                                    });
                                }
                            })
                            shadowRootPopup.getElementById('no-tags-message').style.display = 'none';
                    }
                });
            })
        } else if(kbshortcutmode == true) {
            getSelectionCharOffsetsWithin()
        }
    }
});

function getSelectionCharOffsetsWithin() {
    
    var selection = document.getSelection();
    const range = selection.getRangeAt(0);

    const clientRect = range.getBoundingClientRect();
    var taglist1 = shadowRootPopup.getElementById('tag-list-1').parentElement
    var top, left;
    top = clientRect.top+clientRect.height
    left = clientRect.left+clientRect.width
    if(clientRect.top+clientRect.height > $(window).innerHeight() - 150) {
        top = clientRect.top + clientRect.height - 155
    }
    if(clientRect.left+clientRect.width > $(window).innerWidth() - 270) {
        left = clientRect.left - 275
    }
    $(taglist1).css('top',top+'px')
    $(taglist1).css('left',left+'px')
    shadowRootPopup.getElementById('tag-list-1').parentElement.top = clientRect.top+clientRect.height+'px'
    shadowRootPopup.getElementById('tag-list-1').parentElement.left = clientRect.left+clientRect.width+'px'
    var kbshortcutdiv = shadowRootPopup.getElementById('kbshortcutdiv')
    $(kbshortcutdiv).show()
}

function loadPopup(object) {
    console.log("LoadPopup start!");
    const SPREADSHEET_ID = object===undefined || object===null ? '' : object.id;
    const SPREADSHEET_TITLE = object===undefined || object===null ? 'No sheet was previously used' : object.title;
    const html = document.createElement('html');
    var head = document.createElement('head');
    var head = document.createElement('head');

    var link = document.createElement('link');
    link.rel = "stylesheet";
    link.href = "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css";
    head.appendChild(link);
    
    var script = document.createElement('script');
    script.type = 'javascript';
    script.src = chrome.runtime.getURL('assets/js/libs/bootstrap.min.js');
    head.appendChild(script);

    var script1 = document.createElement('script');
    script.type = 'javascript';
    script.src = chrome.runtime.getURL('assets/js/libs/selectable.min.js');
    head.appendChild(script1);

    var link = document.createElement('link');
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL('assets/css/material-icons.css');
    head.appendChild(link);

    var link = document.createElement('link');
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL('assets/css/style.css');;
    head.appendChild(link);

    var body = document.createElement('body');
    html.appendChild(head);
    html.appendChild(body);
    var html_content = `
    <div style="padding-left: 10px;padding-top: 5px;padding-bottom: 5px;">
        <img width="32" src="${extension_logo}" style="padding-bottom: 5px;"/>
        <span style="font-weight: 600;font-size: large;padding-left:5px;"> ${SPREADSHEET_TITLE} </span>
        <div style="float:right; padding-top:5px; padding-right:5px;">
            <span class="material-icons-outlined" style="cursor:pointer;" id="linkToGuide">
                find_in_page
            </span>
            <span class="material-icons-outlined" style="cursor:pointer;" id="closeContent">
                close
            </span>
        </div>
    </div>
    <div style="width:90%;display:inline-block;">
        <ul class="nav" id="tab-options" style="padding-top:0px;padding-left:10px;">
        
        </ul>
        <div class="line ease" style="left:0%;"></div>
    </div>
    <div style="width: 25px;display: inline-block;height: auto;float:right;">
        <span class=".more-options-button material-icons-outlined" id="content-more-option" style="float:right;padding-bottom: 6px;cursor: pointer;">
            more_vert
        </span>
    </div>
    <div class="tab-content" id="myTabContent" style="background-color: #4b545d;margin-top: -5px">
        <div class="container-fluid" style="height:100vh;">

            <div class="tab" id="label-tab" style="display: block;">
                <div class="choose-spreadsheet-div" hidden>
                    <div class="choose-spreadsheet-main">
                        <div class="choose-spreadsheet-content">
                            <a href="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit" target="_blank" class="choose-spreadsheet-message" data-toggle="modal" data-target="#chooseSheetModal" style="color: #ffffff !important;">${SPREADSHEET_TITLE}</a>
                            <span class="material-icons choose-spreadsheet-icon more-options-button" id="chooseSpreadSheet" title="Choose/Create Sheet">
                                edit
                            </span>
                        </div>
                    </div>
                    <hr>
                </div>
                <div class="inline form-group" id="tags-tab-header" style="padding-top:10px;">
                    <input type="text" class="search-tag" id="search_tag" placeholder="Search tag...">
                    <button class="material-icons-outlined more-options-button" id="create-tag-button" title="Add tag" disabled="" style="border:none; padding-left:10px;">
                        new_label
                    </button>
                </div>
                <div class="" id="tag-list">
                <span class="error" id="no-tags-message" style="display: none;">There are no tags that match your search. Click on the "+" button to create a new tag.</span>
                <div id="spinner" class="overlay-logo"><i class="js-spin icn-spinner"><img src="${overlay_small_spinner}"/></i></div>
                
                </div>
                <div id="rename-modal" class="modal-shadow">
                    <div class="modal-shadow-content">
                        <div class="modal-shadow-header">Rename tag</div><input placeholder="New tag name..." value="Abstract" id="rename-modal-input" title="Abstract"><span id="close_modal" class="material-icons close-modal">close</span>
                        <div class="modal-shadow-buttons"><button class="btn btn-primary btn-sm save-modal-button" disabled="disabled" id="rename-tag-button" title="Abstract">Save</button><button id="cancel_modal" class="btn btn-outline-primary btn-sm close-modal-button">Cancel</button></div>
                    </div>
                </div>
                <div id="change-color-modal" class="modal-shadow">
                    <div class="modal-shadow-content">
                        <div class="modal-shadow-header">Update tag color</div><input type="color" id="new-tag-color"><span class="material-icons close-modal" id="close_color_modal">close</span>
                        <div class="modal-shadow-buttons"><button class="btn btn-primary btn-sm save-modal-button" disabled="disabled" id="change-tag-color" title="Abstract">Save</button><button class="btn btn-outline-primary btn-sm close-modal-button" id="cancel_color_modal">Cancel</button></div>
                    </div>
                </div>
            </div>
            <div class="tab" id="about-tab" style="display: none;">
                <p class="about-text">FluidMemory is a user-friendly qualitative data analysis solution that enables teams to collect and analyze written content across multiple tools including Google Sheets, Google Docs, and Chrome.</p>
                <p>Support: <a href="https://eightarms.bit.ai/docs/view/33zXPjGB7W6AXCGI" targe="_blank">https://eightarms.bit.ai/docs/view/33zXPjGB7W6AXCGI</a></p>
            </div>
            <div class="tab" id="segment-tab" style="display:none">
                <div style="padding-top:10px;">
                    <div>
                        <input type="text" class="search-tag" id="navigator_search" placeholder="Search ..." style="width:400px;">
                        <svg style="width:24px;height:24px;position:absolute;left:370px;top:7px;cursor: pointer;" viewBox="0 0 24 24" id="navigator_search_svg">
                            <path fill="#666666" d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
                        </svg>
                        <span class="material-icons" style="position: absolute;cursor: pointer;float:right;top:7px;right: 0px;" id="content-copy-btn" title="Copy to clipboard">content_copy</span>
                        <div style="float:right;top:7px;" hidden>
                            <img id="copyto-mural" title="Copy to Mural" class="mural-icon" src="${mural_img}" style="cursor:pointer;"/>
                            <img id="copyto-miro" class="miro-icon"  title="Copy to Miro" src="${miro_img}" style="cursor:pointer;"/>
                            <img class="trello-icon" src="${trello_img}"/ hidden>
                            <span class="material-icons" style="cursor: pointer;" id="navigator-more-option">more_vert</span>
                        </div>
                    </div>
                </div>
                <div style="padding-top:10px;width:100%;">
                <table style="font-size: 12px;">
                <thead>
                    <tr>
                        <th style="width:400px;">Quote*</th>
                        <th style="width:120px;">Tag</th>
                        <th style="width:170px;">Document</th>
                        <th style="width:30px;"></th>
                    </tr>
                </thead>
                <table class="scrollable" style="font-size:12px;" id="table">
                <tbody id="table-content">
                </tbody>
            </table>
            </div>
            </div>
            <div class="tab" id="quotes-tab" style="display: none;">
                <div class="choose-spreadsheet-div">
                    <div class="choose-spreadsheet-main">
                        <div class="choose-spreadsheet-content">
                            <a  href="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit" target="_blank" class="choose-spreadsheet-message" data-toggle="modal" data-target="#chooseSheetModal" style="color: #ffffff !important;">${SPREADSHEET_TITLE}</a>
                            <span class="material-icons choose-spreadsheet-icon">
                                edit
                            </span>
                        </div>
                    </div>
                    <hr>
                </div>
                <div class="quotes-section">
                    <label for="input-tag" class="quote-label">Filter by tag</label>
                    <div class="input-and-icon">
                        <input id="input-tag" type="text" list="tag-search-bar" placeholder="Search tags..." class="quotes-inputs custom-select form-control form-control-sm">
                        <span class="material-icons unselect-icon">
                            close
                        </span>
                    </div>
                    <datalist id="tag-search-bar">
                
                    </datalist>
                </div>

                <div class="quotes-section">
                    <label for="input-doc" class="quote-label">Filter by document</label>
                    <div class="input-and-icon">
                        <input id="input-doc" type="text" list="doc-search-bar" placeholder="Search documents..." class="quotes-inputs custom-select form-control form-control-sm">
                        <span class="material-icons unselect-icon">
                            close
                        </span>
                    </div>
                    <datalist id="doc-search-bar">
                    
                    </datalist>
                </div>

                <div class="quotes-section">
                    <label for="input-content" class="quote-label">Filter by content</label>
                    <div class="input-and-icon">
                        <input id="input-content" type="text" placeholder="Search content..." class="quotes-inputs form-control form-control-sm">
                    </div>
                </div>

                <div id="tagged-content" class=""><label class="quote-label">Search results</label>
                    <hr>
                    <div id="search-results">
                        
                    </div>
                   
                </div>

            </div>

            <div class="tab" id="library_books-tab" style="display: none;">
                <div class="inline" id="tags-tab-header" style="padding-top:10px;">
                    <span id="select-sheet-button" class="btn instance-button">
                        Select
                    </span>
                </div>
                <div class="inline" id="tags-tab-header" style="padding-top:5px;padding-bottom: 10px;">
                    <input type="text" class="search-tag" id="search_datasheet" placeholder="Search Datasheets...">
                    <button class="material-icons-outlined more-options-button" id="create-datasheet-button" title="Add datasheet" disabled="disabled" style="border:none; padding-left:10px;">
                        note_add
                    </button>
                </div>
                
                <div style="width:100%;">
                    <table style="font-size: 14px;">
                    <thead>
                        <tr>
                            <th style="width:30px;"></th>
                            <th style="width:240px;"></th>
                        </tr>
                    </thead>
                    <table class="scrollable" style="font-size:14px;" id="sheet-table">
                        <tbody id="sheet-table-content">
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="tab" id="search-tab" style="display: none;">


                <div class="form-group auto-section">
                    <label for="select-keywords" class="auto-label">Select keywords (comma-separated)</label>
                    <textarea class="form-control form-control-sm" id="keyword-input" aria-label="Small" placeholder="Write keywords..." style="height:100px !important;"></textarea>
                    <input type="hidden" id="current-keywords" class="auto-text" value="">
                </div>

                <div class="auto-section" hidden>
                    <label for="matching-type" class="auto-label">What do you want to select?</label>
                    <select name="matching-type" id="matching-type" class="form-control form-control-sm">
                        <option value="word" class="auto-text" aria-label="Small">Single word</option>
                        <option value="sentence" class="auto-text" aria-label="Small">Sentence</option>
                        <option value="three-sentences" class="auto-text" aria-label="Small">Three sentences</option>
                        <option value="paragraph" class="auto-text" aria-label="Small">Whole paragraph</option>
                    </select>
                </div>

                <div class="auto-section" id="library-div">
                    <div id="choose-library-div">
                        <label for="library-list" class="auto-label">
                            Choose library
                        </label>
                        <select name="library-list" id="library-list" class="form-control form-control-sm">
                            <option class="auto-text" id="default-library-option" disabled="" selected="" value="">Select a library:</option>
                        
                        </select>
                    </div>
                </div>

                <div class="auto-section" id="arrows-and-button" style="padding-bottom:10px;">
                    <span id="previous-instance-button" class="btn instance-button" style="display:none;">
                        Last
                    </span>
                    <span id="next-instance-button" class="btn instance-button">
                        Search
                    </span>
                    <input type="hidden" id="instance-counter" value="0">
                </div>

                <hr>

                <div id="auto-tag-list" style="padding-top:15px;">
                </div>
            </div>
        </div>
    </div>

    <!-- Modal -->
    <div class="modal-backdrop" id="modalBackdrop"></div>
<div class="modal" id="chooseSheetModal" tabindex="-1" role="dialog" aria-labelledby="chooseSheetModal" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title" id="chooseSheetModalLongTitle">Choose a Google Sheet to keep your tags, content and libraries</h3>
        <button type="button" id="close_chooseSheetModal" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <p>You have two choices for selecting the sheet to keep your tags, content and libraries.</p>
        <div class="choose-spreadsheet-section" id="current-spreadsheet-section">
            <span>Current sheet used for tagging:</span>
            <a id="current-spreadsheet" href="https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit" target="_blank">${SPREADSHEET_TITLE}</a>
        </div>

        <div class="choose-spreadsheet-section" id="spreadsheet-action-section">
            <select name="spreadsheet-action" id="spreadsheet-action" class="form-control form-control-sm">
                <option value="select-one" class="auto-text" aria-label="Small">Select one...</option>
                <option value="use-previous" class="auto-text" aria-label="Small">
                Use previous Google Sheet that was used for tagging
                </option>
                <option value="create-new" class="auto-text" aria-label="Small">
                Create new Sheet for tagging
                </option>
            </select>
        </div>
        <div id="select-one-div" style="display: none;"> </div>
        <div id="previous-spreadsheet-list" style="display: none;">
          
        </div>
        <div id="create-spreadsheet-div" style="display: none;">
            <input type="text" id="create-spreadsheet-name" placeholder="Name your new Google Sheet..." class="form-control form-control-sm">
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal" id="dismisModal">Cancel</button>
        <button type="button" class="btn btn-primary" id="confirm-button" disabled>Ok</button>
      </div>
    </div>
  </div>
</div>
        `;

    var kb_dialog = `<div style="background-color: rgb(76, 83, 93); position: fixed; top: 251.547px; left: 1176.56px; width: 200px; padding: 3px; border-radius: 10px;box-shadow: 0px 0px 10px;display:none;" id="kbshortcutdiv">
        <div style="padding-left: 5px;padding-right: 5px;z-index:10;"><input type="text" class="search-tag" id="search_tag_1" placeholder="Search tag..." style="width:100%;display:block;"></div>
        <div class="" id="tag-list-1" style="padding-top: 10px; max-height:120px; overflow-y:auto;padding-left:5px;padding-right:5px;">
        </div>
        </div>
    `
    body.innerHTML = html_content;
    body.innerHTML += kb_dialog
    body.id = 'mbody'
    shadowRootPopup.innerHTML = null;
    shadowRootPopup.appendChild(html);
    if(object == undefined) {
        
        shadowRootPopup.querySelectorAll('.material-icons-outlined').forEach(materialicon => {
            $(materialicon).hide()
        })
        
        shadowRootPopup.querySelectorAll('.material-icons').forEach(materialicon => {
            $(materialicon).hide()
        })
        shadowWrapper_popup.style.width = '0'
    }
    var taglistheight = ( window.innerHeight - 120 ) + "px"
    shadowRootPopup.getElementById('tag-list').style.height = taglistheight

    focusBtn("collapse-expand-button")
    var tab_array = ['label','search', 'segment','library_books'];
    var i = 0;
    tab_array.forEach(element => {
        i++;
        var li = document.createElement('li');
        li.className = 'nav-item tab-item';
        var a = document.createElement('a');
        a.className = 'material-icons-outlined tab-link nav-link';
        if (i <= 1) {
            a.classList.add('active-tab');
            a.classList.add('active');
            a.classList.add('show');
        }
        a.setAttribute('tab-id', element.toLowerCase() + '-tab');
        a.setAttribute('style','padding: 5px; font-size: 25px;')
        a.id = element + '-tab-link';
        a.text = element;
        li.appendChild(a);
        shadowRootPopup.getElementById('tab-options').appendChild(li);
        a.onclick = function(e) {
            shadowRootPopup.querySelectorAll('.active').forEach(item => {
                item.classList.remove("active");
            });
            this.classList.toggle('active');
            shadowRootPopup.querySelectorAll('.tab').forEach(item => {
                item.style = "display:none"
            });
            var tab_id = this.getAttribute('tab-id');
            if(tab_id == 'label-tab') {
                controlSidePanel(350)
                shadowRootPopup.querySelector('.line').style.left = "0%";
                host_popup.style.width = '350px'
            } else if(tab_id == 'search-tab'){
                controlSidePanel(350)
                shadowRootPopup.querySelector('.line').style.left = "25%";
                host_popup.style.width = '350px'
            } else if(tab_id == 'segment-tab') {
                controlSidePanel(750)
                shadowRootPopup.querySelector('.line').style.left = "50%";
                host_popup.style.width = '750px'
            } else if(tab_id == 'library_books-tab') {
                controlSidePanel(350)
                shadowRootPopup.querySelector('.line').style.left = "75%";
                host_popup.style.width = '350px'
            }
            shadowRootPopup.getElementById(tab_id).style = "display:block";
        }
    })

    shadowRootPopup.getElementById('select-sheet-button').onclick = function() {

        radios = shadowRootPopup.querySelectorAll('.form-check-input')
        radios.forEach(radio => {
            if(radio.checked == true) {
                selectedPrev = {
                    id: radio.parentElement.getAttribute('sid'),
                    name: radio.parentElement.parentElement.parentElement.children[1].innerText
                }
            }
        })
        debugger
        clear_highlight();
        chrome.storage.local.set({
            'current_sheet' : selectedPrev
        }, function() {
            chrome.runtime.sendMessage({
                contentScriptQuery: "changeSheet",
                data: selectedPrev
            }, function() {
                console.log('Spreadsheet selected');
                shadowRootPopup.getElementById('chooseSheetModal').classList.remove('show');
                shadowRootPopup.getElementById('modalBackdrop').classList.remove('show');
            });
            slide()
            // $('#shadow-wrapper-popup-eathu').slideToggle("slow");

        })
    }
    
    shadowRootPopup.getElementById('navigator_search').onkeyup = function() {
        console.log('search')
        var value = $(this).val().toLowerCase();
        $(shadowRootPopup.getElementById('table').getElementsByTagName('tr')).filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });
    }
    
    
    shadowRootPopup.getElementById('linkToGuide').onclick = function() {
        window.open(`https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`, '_blank');
    }
    
    shadowRootPopup.getElementById('search_datasheet').onkeyup = function() {
        var value = $(this).val().toLowerCase();
        $(shadowRootPopup.getElementById('sheet-table').getElementsByTagName('tr')).filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1)
        });

        
        var check = 0
        for(i=0;i<$(shadowRootPopup.getElementById('sheet-table').getElementsByTagName('tr')).length;i++) {
            var temptr = $(shadowRootPopup.getElementById('sheet-table').getElementsByTagName('tr'))[i]
            if($(this).val() == temptr.children[1].innerHTML) {
                check = 1
            }
        }

        if(check == 1) {
            $(shadowRootPopup.getElementById('create-datasheet-button')).attr('disabled','disabled')
        } else {
            $(shadowRootPopup.getElementById('create-datasheet-button')).removeAttr('disabled')
        }

        if(value == '') {
            $(shadowRootPopup.getElementById('create-datasheet-button')).attr('disabled','disabled')
        }
    }

    shadowRootPopup.getElementById('content-copy-btn').onclick = function() {
        selectedTr = shadowRootPopup.querySelectorAll('.row-selected')
        var clip = ``
        for(i=0; i<selectedTr.length; i++) {
            clip += (selectedTr[i].children[0].innerText+"<br>")
            clip += ("Code: #"+selectedTr[i].getAttribute('code')+"<br>")
            clip += ("Author: "+selectedTr[i].getAttribute('arthor')+"<br>")
            clip += ("Source: "+selectedTr[i].getAttribute('source')+"<br>")
            clip += ("Datasheet: "+selectedTr[i].getAttribute('datasheet')+"<br>")
            if(i!=selectedTr.length-1) {
                clip += '\t'
            }
        }
        if(clip != ``) {
            navigator.clipboard.writeText(clip)
        }
    }

    shadowRootPopup.getElementById('create-datasheet-button').onclick = function() {
        let name = shadowRootPopup.getElementById('search_datasheet');
        chrome.runtime.sendMessage({
            contentScriptQuery: "createNewSheet",
            title: name.value
        },
        function(result) {
            console.log(result);
            if (result.success) {
                shadowRootPopup.getElementById('confirm-button').innerText = 'Ok';
                var selected_sheet = {
                    id: result.response.id,
                    name: result.response.name
                }

                clear_highlight();
                chrome.storage.local.set({
                    'current_sheet' : selected_sheet
                }, function() {
                    chrome.runtime.sendMessage({
                        contentScriptQuery: "newSheet",
                        data: selected_sheet
                    }, function() {
                        console.log('Spreadsheet selected');
                        shadowRootPopup.getElementById('chooseSheetModal').classList.remove('show');
                        shadowRootPopup.getElementById('modalBackdrop').classList.remove('show');
                        var t_spinner = shadowRootPopup.getElementById('spinner');
                        $(t_spinner).removeAttr("style");
                        slide()
                        // $('#shadow-wrapper-popup-eathu').slideToggle("slow");

                    });
                })
            }
        })
    }

    
    shadowRootPopup.getElementById('close_modal').onclick = closeRenameModal;
    shadowRootPopup.getElementById('cancel_modal').onclick = closeRenameModal;
    
    function closeRenameModal() {
        shadowRootPopup.getElementById('rename-modal').style = 'display: none;';
    }
    
    shadowRootPopup.getElementById('close_color_modal').onclick = closeColorModal;
    shadowRootPopup.getElementById('cancel_color_modal').onclick = closeColorModal;
    
    load_navigator()
    
    function closeColorModal() {
        shadowRootPopup.getElementById('change-color-modal').style = 'display: none;';
    }
}

function load_navigator() {
    console.log('reload table')
    chrome.runtime.sendMessage({
        contentScriptQuery: "getContent"
    },
    function(contents) {
        $(shadowRootPopup.getElementById('table-content')).empty()
        for(i=0; i<contents.length; i++) {
            var table_row = `
            <tr ondblclick='window.open("`+contents[i][5]+`", "_blank")' class="tbody-row" code="`+contents[i][1]+`" arthor="`+contents[i][2]+`" source="`+contents[i][5]+`" datasheet="`+shadowRootPopup.getElementById('current-spreadsheet').getAttribute('href')+`">
                <td style="width:400px;">`+contents[i][0]+`</td>
                <td style="width:120px;">`+contents[i][1]+`</td>
                <td style="width:170px;">`+contents[i][3]+`</td>
                <td style="width:30px;"><span class="material-icons table-more-option" style="cursor: pointer;" index="`+i+`" id="table-more-`+i+`">more_vert</span></td>
            </tr>`
            $(shadowRootPopup.getElementById('table-content')).append(table_row)

        }
        
        chrome.runtime.sendMessage({
            contentScriptQuery: "get-status"
        }, function(result) {
            var icons = shadowRootPopup.querySelectorAll('.mural-icon')
            icons.forEach(icon => {
                if(result.response[1] == 0){
                    icon.setAttribute('hidden',true)
                } else {
                    icon.removeAttribute('hidden')
                }
            })

            var icons = shadowRootPopup.querySelectorAll('.miro-icon')
            icons.forEach(icon => {
                if(result.response[2] == 0){
                    icon.setAttribute('hidden',true)
                } else {
                    icon.removeAttribute('hidden')
                }
            })

            var icons = shadowRootPopup.querySelectorAll('.trello-icon')
            icons.forEach(icon => {
                if(result.response[3] == 0){
                    icon.setAttribute('hidden',true)
                } else {
                    icon.removeAttribute('hidden')
                }
            })
        })
        $(shadowRootPopup.getElementById('table').getElementsByTagName('tr')).filter(function() {
            $(this).toggle($(this).text().toLowerCase().indexOf($(shadowRootPopup.getElementById('navigator_search')).val()) > -1)
          });
        var table_more_options = shadowRootPopup.querySelectorAll('.table-more-option')
        table_more_options.forEach(table_more_option => {
            table_more_option.onclick = function() {
                if(this.parentElement.parentElement.classList.length == 2) {
                    this.parentElement.parentElement.classList.remove('row-selected')
                } else {
                    this.parentElement.parentElement.classList.add('row-selected')
                }
                var content = shadowRootPopup.getElementById(this.id)
                const elements = shadowRootPopup.querySelectorAll('.popup-menu');
                if (elements != null) {
                    if (elements.length > 0) {
                        elements.forEach(element => {
                            // if(element.title != this.title){
                            element.parentNode.removeChild(element);
                            // }
                        })
                    }
                    {
                        var popup_menu = document.createElement('div');
                        popup_menu.className = 'popup-menu';
                        popup_menu.id="popup-menu-id";

                        
                        var delete_tag = document.createElement('div');
                        delete_tag.className = 'delete-tag dropdown-item';
                        var icon_span = document.createElement('span');
                        icon_span.className = 'material-icons-outlined popup-icon';
                        icon_span.innerText = 'delete';
                        delete_tag.appendChild(icon_span);
                        var name_span = document.createElement('span');
                        name_span.className = 'popup-name';
                        name_span.innerText = 'Delete';
                        delete_tag.onclick = function () {
                            this.parentElement.remove()
                            $('.fluid-overlay').show();
                                chrome.runtime.sendMessage({
                                        contentScriptQuery: "deleteContent",
                                        index: content.getAttribute('index')*1+2
                                    },
                                    function(result) {
                                        if (result.success) {
                                            shadowRootPopup.getElementById('search-results').innerHTML = '';
                                            console.log("Delete button clicked");
                                            chrome.runtime.sendMessage({
                                                    contentScriptQuery: "getTags",
                                                },
                                                function(result) {
                                                    load_navigator()
                                                    result.forEach(element => {
                                                        $('.fluid-overlay').hide();
                                                        // searchResultContents(element);
                                                    })
                                                })

                                        }
                                    });
                        }
                        delete_tag.appendChild(name_span);
                        popup_menu.appendChild(delete_tag);
                        popup_menu.style.top = (content.getBoundingClientRect().top + 30) + 'px'
                        popup_menu.style.position = 'fixed'
                        popup_menu.style.right = '30px'
                        // end popup menu
                        content.parentElement.appendChild(popup_menu);
                    }
                }
            }
        })

        var tbody_rows = shadowRootPopup.querySelectorAll('.tbody-row')
        tbody_rows.forEach(tbody_row => {
            tbody_row.onclick = function() {
                if(this.classList.length == 2) {
                    this.classList.remove('row-selected')
                } else {
                    this.classList.add('row-selected')
                }
            }
        })
    })

}

$(document).mouseup(e => {
    var main = shadowRootPopup.getElementById('shadow-wrapper-popup-eathu')
    var main1 = $("#shadow-wrapper-popup-eathu")
    if($(e.target).attr("id") != "shadow-wrapper-popup-eathu") {
        var kbshortcutdiv = shadowRootPopup.getElementById('kbshortcutdiv')
        $(kbshortcutdiv).hide()
    }
    try {
        shadowRootPopup.getElementById('popup-menu-id').setAttribute('hidden', 'hidden')
    } catch(e) {

    }
})



function generateTagUI(element, i) {
    chrome.runtime.sendMessage({
        contentScriptQuery: "check-pin-tag",
        tagname: element[0]
    }, function(checkresult) {
        console.log("Tag generated!");
        var divider = document.createElement('div');
        divider.className = 'tag-and-divider';
        //divider.title = element[0];
        var container = document.createElement('div');
        container.className = 'main-tag';
        //container.title = element[0];
        divider.appendChild(container);
        var content = document.createElement('div');
        content.className = 'tag';
        //content.title = element[0];
        container.appendChild(content);
        var btn_tag = document.createElement('span');
        btn_tag.className = 'material-icons-outlined select-tag-button';
        btn_tag.title = "Tag";
        btn_tag.innerText = 'label';
        btn_tag.style = `color: ${element[1]};`
        content.appendChild(btn_tag);
        var btn_color = document.createElement('input');
        btn_color.setAttribute("type", "color");
        btn_color.className = 'change-color-input';
        btn_color.value = element[1];
        btn_color.title = "Color";
        btn_color.setAttribute('range_index', i);
        content.appendChild(btn_color);
        var btn_visibility = document.createElement('span');
        btn_visibility.className = 'material-icons-outlined toggle-visibility-button';
        btn_visibility.title = "Show/Hide";
        btn_visibility.innerText = 'visibility';
        btn_visibility.setAttribute('tag-color', element[1]);
        content.appendChild(btn_visibility);
        var btn_pin = document.createElement('span');
        btn_pin.className = 'material-icons pin-tag-button';
        btn_pin.title = 'Pin';
        btn_pin.innerText = 'push_pin';
        
        if(checkresult.response == true) btn_pin.className = 'material-icons pinned-tag-button';
        else btn_pin.className = 'material-icons pin-tag-button';

        var pindiv = document.createElement('div');
        pindiv.className = 'tag-and-divider';
        //divider.title = element[0];
        var pincontainer = document.createElement('div');
        pincontainer.className = 'main-tag';
        //container.title = element[0];
        pindiv.appendChild(pincontainer);
        var pincontent = document.createElement('div');
        pincontent.className = 'tag';
        //content.title = element[0];
        pincontainer.appendChild(pincontent);
        var pin_btn_tag = document.createElement('span');
        pin_btn_tag.className = 'material-icons-outlined select-tag-button';
        pin_btn_tag.title = "Tag";
        pin_btn_tag.innerText = 'label';
        pin_btn_tag.style = `color: ${element[1]};`
        pincontent.appendChild(pin_btn_tag);
        var pin_tag_name = document.createElement('span');
        pin_tag_name.className = 'tag-name';
        pin_tag_name.title = element[0];
        pin_tag_name.innerText = element[0];
        pin_btn_tag.onclick = function() {
            if (window.getSelectedText().length > 0) {
                $('.fluid-overlay').show();
                var tag_name = this.parentElement.children[1].title;
                chrome.runtime.sendMessage({
                        contentScriptQuery: "getUser",
                    }, function(user) {
                        console.log(user);
                        var s_range;
                        if(window.location.href.match(/\.pdf$/)) {
                            var pageIndex = PDFViewerApplication.pdfViewer.currentPageNumber - 1; 
                            var page = PDFViewerApplication.pdfViewer.getPageView(pageIndex);
                            var pageRect = page.canvas.getClientRects()[0];
                            var selectionRects = window.getSelection().getRangeAt(0).getClientRects();
                            var selectionRectList = [];
                            i=0;
                            while(1) {
                                if(selectionRects[i+1]==undefined) {
                                    selectionRectList.push(selectionRects[i]);
                                    break;
                                }
                                if(selectionRects[i].x == selectionRects[i+1].x && selectionRects[i].width == selectionRects[i+1].width) {
                                    selectionRects[i] = compare(selectionRects[i], selectionRects[i+1]);
                                    selectionRects[i+1] = compare(selectionRects[i], selectionRects[i+1]);
                                    selectionRectList.push(selectionRects[i]);
                                    i++;
                                } else {
                                    selectionRectList.push(selectionRects[i]);
                                }
                                i++;
                            }
                            var viewport = page.viewport;
                            var selected = [];
                            for(i=0;i<selectionRectList.length;i++) {
                                r = selectionRectList[i];
                                try {
                                selected.push(viewport.convertToPdfPoint(r.left - pageRect.x, r.top - pageRect.y).concat(
                                    viewport.convertToPdfPoint(r.right - pageRect.x, r.bottom - pageRect.y))); 
                                } catch(e) { }
                            }
                            // var selected = selectionRects.map(function (r) {
                            //   viewport.convertToPdfPoint(r.left - pageRect.x, r.top - pageRect.y).concat(
                            //      viewport.convertToPdfPoint(r.right - pageRect.x, r.bottom - pageRect.y)); 
                            // });
                            s_range = { page: pageIndex, coords: selected };
                        } else {
                            var range = window.getSelection().getRangeAt(0);
                            var preSelectionRange = range.cloneRange();
                            preSelectionRange.selectNodeContents(document);
                            preSelectionRange.setEnd(range.startContainer, range.startOffset);
                            var start = preSelectionRange.toString().length;
                            s_range = {
                                start: start,
                                end: start + range.toString().length
                            };
                        }
                        var output = {
                            content: window.getSelection().toString(),
                            code: tag_name,
                            document: document.title,
                            doc_url:   (window.location.href.match(/\.pdf$/) === null) ? window.location.href : window.location.href.replace("chrome-extension://nbimgbgchmccioidaopfhokkongfhkoe/",""),
                            email: user.email,
                            range: JSON.stringify(s_range),
                            time: moment().format('MM/DD/YYYY HH:mm:ss')
                        }

                        chrome.runtime.sendMessage({
                                contentScriptQuery: "recordContent",
                                data: output,
                                method: 'POST'
                        }, function(result) {
                            var kbshortcutdiv = shadowRootPopup.getElementById('kbshortcutdiv')
                            $(kbshortcutdiv).hide()
                            if (result.success) {
                                load_navigator()
                                markText(output.content, btn_color.value, s_range);
                                chrome.runtime.sendMessage({
                                    contentScriptQuery: "getTags",
                                }, function(result) {
                                    if (result !== undefined) {
                                        shadowRootPopup.getElementById('search-results').innerHTML = '';
                                        shadowRootPopup.getElementById('spinner').style = "display: none;";
                                        result.forEach(element => {
                                            searchResultContents(element);
                                        })
                                    } else {
                                        shadowRootPopup.getElementById('spinner').innerHTML = '<h5> Something is wrong. Please try again by refreshing the page.</h5>';
                                    }
                                });
                            }
                        })
                    })
            } else {
                console.log('no selection!');
            }

        }
        pincontent.appendChild(pin_tag_name);

        btn_pin.onclick = function() {
            if(this.className == 'material-icons pin-tag-button') {
                pinned = this.parentElement.parentElement.parentElement;
                this.parentElement.parentElement.parentElement.remove()
                shadowRootPopup.getElementById('tag-list').prepend(pinned)
                chrome.runtime.sendMessage({
                    contentScriptQuery: "add-pin-tag",
                    tagname: element[0]
                }, function(result) {
                })
                shadowRootPopup.getElementById('auto-tag-list').prepend(pindiv)
                this.className = 'material-icons pinned-tag-button'
            } else if(this.className == 'material-icons pinned-tag-button') {
                chrome.runtime.sendMessage({
                    contentScriptQuery: "remove-pin-tag",
                    tagname: element[0]
                }, function(result) {
                })
                this.className = 'material-icons pin-tag-button'
            }
        }
        content.appendChild(btn_pin);
        var tag_name = document.createElement('span');
        tag_name.className = 'tag-name';
        tag_name.title = element[0];
        tag_name.innerText = element[0];
        content.appendChild(tag_name);
        var btn_more = document.createElement('span');
        btn_more.className = 'material-icons more-options-button';
        btn_more.title = "Tag options";
        btn_more.innerText = 'more_vert';
        btn_more.onclick = function() {
            const elements = shadowRootPopup.querySelectorAll('.popup-menu');
            if (elements != null) {
                if (elements.length > 0) {
                    elements.forEach(element => {
                        // if(element.title != this.title){
                        element.parentNode.removeChild(element);
                        // }
                    })
                } 
                {
                    // popup menu
                    var popup_menu = document.createElement('div');
                    popup_menu.className = 'popup-menu';
                    popup_menu.id="popup-menu-id";
                    popup_menu.title = element[0];

                    var rename_tag = document.createElement('div');
                    rename_tag.className = 'rename-tag dropdown-item';
                    var icon_span = document.createElement('span');
                    icon_span.className = 'material-icons-outlined popup-icon';
                    icon_span.innerText = 'mode_edit';
                    rename_tag.appendChild(icon_span);
                    var name_span = document.createElement('span');
                    name_span.className = 'popup-name';
                    name_span.innerText = 'Rename';
                    rename_tag.appendChild(name_span);
                    rename_tag.onclick = function() {
                        var modal = shadowRootPopup.getElementById('rename-modal');
                        modal.style = 'display: block;';
                        
                        var popup_menu = shadowRootPopup.getElementById('popup-menu-id');
                        popup_menu.style.display = 'none';
                        var rename_input = shadowRootPopup.getElementById('rename-modal-input');
                        var btn_save = shadowRootPopup.getElementById('rename-tag-button');
                        rename_input.value = element[0];
                        var prev_tagname = element[0];
                        btn_save.setAttribute('range_index', i);
                        rename_input.onkeyup = function() {
                            btn_save.disabled = this.value === element[0] ? true : false;
                        }
                        btn_save.onclick = function() {
                            btn_save.innerText = 'Saving...'
                            btn_save.disabled = true;
                            
                            var ri = this.getAttribute('range_index');

                            var output_tags = {
                                tag: rename_input.value,
                                color: element[1],
                                index: element[2],
                                miro_color: element[3],
                                researcher: element[4],
                                time: moment().format('MM/DD/YYYY HH:mm:ss')
                            }
                            chrome.runtime.sendMessage({
                                contentScriptQuery: "updateTags",
                                data: output_tags,
                                range: 'A' + ri + ':' + 'F' + ri
                            }, function(result) {
                                if (result.success) {
                                    modal.style = 'display: none;';
                                    chrome.runtime.sendMessage({
                                        contentScriptQuery: "getTags",
                                    }, function(result) {
                                        if (result !== undefined) {
                                            chrome.runtime.sendMessage({
                                                contentScriptQuery: "getContent"
                                            }, function(contents) {
                                                var tempContents = [];
                                                var ind = 1;
                                                if(contents != null) {
                                                    contents.forEach(content => {
                                                        ind++;
                                                        if(content[1] === prev_tagname) {
                                                            var tt = content;
                                                            tt.ind = ind;
                                                            tempContents.push(tt);
                                                        }
                                                    });
                                                    tempContents.forEach(content => {
                                                        var temp = content;
                                                        temp[1] = rename_input.value;
                                                        var output = {
                                                            content: temp[0],
                                                            code: temp[1],
                                                            document: temp[3],
                                                            doc_url: temp[5],
                                                            email: temp[2],
                                                            range: temp[6],
                                                            time: moment().format('MM/DD/YYYY HH:mm:ss')
                                                        }

                                                        chrome.runtime.sendMessage({
                                                            contentScriptQuery: "deleteContent",
                                                            index: content.ind
                                                        }, function(result) {
                                                            if (result.success) {
                                                                chrome.runtime.sendMessage({
                                                                    contentScriptQuery: "recordContent",
                                                                    data: output,
                                                                    method: 'POST'
                                                                },
                                                                function(result) {
                                                                    load_navigator()
                                                                    var kbshortcutdiv = shadowRootPopup.getElementById('kbshortcutdiv')
                                                                    $(kbshortcutdiv).hide()
                                                                    if (result.success) {
                                                                    }
                                                                })
                                                            }
                                                        });
                                                    })
                                                }
                                            });
                                            shadowRootPopup.getElementById('search-results').innerHTML = '';
                                            var taglist = shadowRootPopup.getElementById('tag-list');
                                            var childs = shadowRootPopup.querySelectorAll('.tag-and-divider')
                                            childs.forEach(child => {
                                                taglist.removeChild(child);
                                                taglist1.removeChild(child);
                                            });
                                            shadowRootPopup.getElementById('spinner').style = "display: none;";
                                            var i = 1;
                                            result.forEach(element => {
                                                i++;
                                                generateTagUI(element, i);
                                                generateTagUI1(element, i);
                                                searchResultContents(element);
                                            })
                                        } else {
                                            shadowRootPopup.getElementById('spinner').innerHTML = '<h5> Something is wrong. Please try again by refreshing the page.</h5>';
                                        }
                                    })
                                }
                            })

                        }
                    }
                    popup_menu.appendChild(rename_tag);
                    var change_color_tag = document.createElement('div');
                    change_color_tag.className = 'change-color dropdown-item';
                    var icon_span = document.createElement('span');
                    icon_span.className = 'material-icons-outlined popup-icon';
                    icon_span.innerText = 'color_lens';
                    change_color_tag.appendChild(icon_span);
                    var name_span = document.createElement('span');
                    name_span.className = 'popup-name';
                    name_span.innerText = 'Change color';
                    change_color_tag.appendChild(name_span);
                    change_color_tag.onclick = function() {
                        var popup_menu = shadowRootPopup.getElementById('popup-menu-id');
                        popup_menu.style.display = 'none';
                        var modal = shadowRootPopup.getElementById('change-color-modal');
                        modal.style = 'display: block;';
                        var color_input = shadowRootPopup.getElementById('new-tag-color');
                        color_input.value = element[1];
                        var btn_save = shadowRootPopup.getElementById('change-tag-color');
                        btn_save.setAttribute('range_index', i);
                        color_input.onchange = function() {
                            btn_save.disabled = this.value === element[1] ? true : false;
                        }
                        btn_save.onclick = function() {
                            $('.fluid-overlay').show();
                            btn_save.innerText = 'Saving...'
                            btn_save.disabled = true;
                            var ri = this.getAttribute('range_index');
                            var output_tags = {
                                tags: tag_name.title,
                                color: color_input.value,
                                index: element[2],
                                miro_color: element[3],
                                researcher: element[4],
                                time: moment().format('MM/DD/YYYY HH:mm:ss')

                            }
                            chrome.runtime.sendMessage({
                                    contentScriptQuery: "updateTags",
                                    data: output_tags,
                                    range: 'A' + ri + ':' + 'F' + ri
                                },
                                function(result) {
                                    if (result.success) {
                                        btn_color.value = color_input.value;
                                        btn_tag.style = `color: ${color_input.value};`
                                        modal.style = 'display: none;';
                                        chrome.runtime.sendMessage({
                                                contentScriptQuery: "getContent"
                                            },
                                            function(contents) {
                                                if(contents != null) {
                                                    contents.forEach(content => {
                                                        if (content[1].indexOf(output_tags.tags) >= 0) {
                                                            markText(content[0], output_tags.color, content[6]);
                                                        } else {
                                                            console.log("not matched");
                                                            $('.fluid-overlay').hide();
                                                        }
                                                    });
                                                }
                                            });
                                    }
                                })

                        }
                    }
                    popup_menu.appendChild(change_color_tag);

                    var popup_divider = document.createElement('div');
                    popup_divider.className = 'dropdown-divider popup-divider';
                    popup_menu.appendChild(popup_divider);

                    var delete_tag = document.createElement('div');
                    delete_tag.className = 'delete-tag dropdown-item';
                    var icon_span = document.createElement('span');
                    icon_span.className = 'material-icons-outlined popup-icon';
                    icon_span.innerText = 'delete';
                    delete_tag.appendChild(icon_span);
                    var name_span = document.createElement('span');
                    name_span.className = 'popup-name';
                    name_span.innerText = 'Delete';
                    delete_tag.appendChild(name_span);
                    delete_tag.onclick = function() {
                        var popup_menu = shadowRootPopup.getElementById('popup-menu-id');
                        popup_menu.style.display = 'none';
                        const elements = shadowRootPopup.querySelectorAll('.del-modal');
                        if (elements != null) {
                            if (elements.length > 0) {
                                elements.forEach(element => {
                                    element.parentNode.removeChild(element);
                                });
                            } else {
                                // delete modal
                                var del_modal = document.createElement('div');
                                del_modal.className = 'modal-shadow del-modal';
                                del_modal.id = 'delete-tag-modal';
                                var del_modal_content = document.createElement('div');
                                del_modal_content.className = 'modal-shadow-content';
                                del_modal.appendChild(del_modal_content);
                                var del_modal_header = document.createElement('div');
                                del_modal_header.className = 'modal-shadow-header';
                                del_modal_header.innerText = 'Delete tag';
                                del_modal_content.appendChild(del_modal_header);
                                var div_d = document.createElement('div');
                                div_d.innerText = 'This code will be deleted for everyone tagging this document!';
                                del_modal_content.appendChild(div_d);
                                var close_span = document.createElement('span');
                                close_span.className = 'material-icons close-modal';
                                close_span.innerText = 'close';
                                close_span.onclick = function(e) {
                                    var element = shadowRootPopup.getElementById('delete-tag-modal');
                                    element.parentElement.removeChild(element);
                                }
                                del_modal_content.appendChild(close_span);
                                var footer_button = document.createElement('div');
                                footer_button.className = 'modal-shadow-buttons';
                                var btn_delete = document.createElement('button');
                                btn_delete.className = 'btn btn-primary btn-sm save-modal-button';
                                btn_delete.title = 'Delete';
                                btn_delete.innerText = 'Delete';
                                btn_delete.setAttribute('index', i);
                                btn_delete.setAttribute('color', element[1]);
                                btn_delete.setAttribute('tag', element[0]);
                                btn_delete.onclick = function() {
                                    $('.fluid-overlay').show();
                                    let color = this.getAttribute('color');
                                    let ztag = this.getAttribute('tag');
                                    chrome.runtime.sendMessage({
                                            contentScriptQuery: "deleteTag",
                                            index: this.getAttribute('index')
                                        },
                                        function(result) {
                                            if (result.success) {
                                                shadowRootPopup.getElementById('search-results').innerHTML = '';
                                                var taglist = shadowRootPopup.getElementById('tag-list');
                                                var childs = shadowRootPopup.querySelectorAll('.tag-and-divider')
                                                childs.forEach(child => {
                                                    taglist.removeChild(child);
                                                    taglist1.removeChild(child);
                                                });
                                                chrome.runtime.sendMessage({
                                                        contentScriptQuery: "getTags",
                                                    },
                                                    function(result) {
                                                        var j = 1;
                                                        result.forEach(element => {
                                                            j++;
                                                            generateTagUI(element, j);
                                                            generateTagUI1(element, j);
                                                            searchResultContents(element);
                                                            removeHighlight(color);
                                                        })
                                                    });

                                                // delete respected contents of that tag
                                                chrome.runtime.sendMessage({
                                                        contentScriptQuery: "getContent"
                                                    },
                                                    function(contents) {
                                                        var ti = 1;
                                                        contents.forEach(content => {
                                                            ti++;
                                                            if (content[1].indexOf(ztag) >= 0) {
                                                                chrome.runtime.sendMessage({
                                                                        contentScriptQuery: "deleteContent",
                                                                        index: ti
                                                                    },
                                                                    function(result) {
                                                                        if (result.success) {
                                                                            console.log('content deleted!')
                                                                        }
                                                                    });
                                                            } else {
                                                                console.log("not matched");
                                                                $('.fluid-overlay').hide();
                                                            }
                                                        });
                                                    });
                                            }
                                        });
                                }
                                footer_button.appendChild(btn_delete);
                                var btn_cancel = document.createElement('button');
                                btn_cancel.className = 'btn btn-outline-primary btn-sm close-modal-button';
                                btn_cancel.title = 'Cancel';
                                btn_cancel.innerText = 'Cancel';
                                btn_cancel.onclick = function() {
                                    var element = shadowRootPopup.getElementById('delete-tag-modal');
                                    element.parentElement.removeChild(element);
                                }
                                footer_button.appendChild(btn_cancel);

                                del_modal_content.appendChild(footer_button);
                                // end delete modal
                                content.appendChild(del_modal);
                            }
                        }
                    }
                    popup_menu.appendChild(delete_tag);
                    // end popup menu
                    content.appendChild(popup_menu);
                }
            }
        }
        content.appendChild(btn_more);
        var hr = document.createElement('hr');
        divider.appendChild(hr);
        
        if(checkresult.response == true) { 
            shadowRootPopup.getElementById('tag-list').prepend(divider)
            
            
            shadowRootPopup.getElementById('auto-tag-list').prepend(pindiv)
            btn_pin.className = 'material-icons pinned-tag-button';
        } else {
            shadowRootPopup.getElementById('tag-list').appendChild(divider);
        }

        // shadowRootPopup.getElementById('tag-list').appendChild(divider);
        btn_tag.onclick = function() {
            if (window.selection_buffer.length > 0) {
                $('.fluid-overlay').show();
                var tag_name = this.parentElement.children[4].title;
                chrome.runtime.sendMessage({
                        contentScriptQuery: "getUser",
                    }, function(user) {
                        console.log(user);
                        var s_range;
                        if(window.location.href.match(/\.pdf$/)) {
                            var pageIndex = PDFViewerApplication.pdfViewer.currentPageNumber - 1; 
                            var page = PDFViewerApplication.pdfViewer.getPageView(pageIndex);
                            var pageRect = page.canvas.getClientRects()[0];
                            var selectionRects = window.getSelection().getRangeAt(0).getClientRects();
                            var selectionRectList = [];
                            i=0;
                            while(1) {
                                if(selectionRects[i+1]==undefined) {
                                    selectionRectList.push(selectionRects[i]);
                                    break;
                                }
                                if(selectionRects[i].x == selectionRects[i+1].x && selectionRects[i].width == selectionRects[i+1].width) {
                                    selectionRects[i] = compare(selectionRects[i], selectionRects[i+1]);
                                    selectionRects[i+1] = compare(selectionRects[i], selectionRects[i+1]);
                                    selectionRectList.push(selectionRects[i]);
                                    i++;
                                } else {
                                    selectionRectList.push(selectionRects[i]);
                                }
                                i++;
                            }
                            var viewport = page.viewport;
                            var selected = [];
                            for(i=0;i<selectionRectList.length;i++) {
                                r = selectionRectList[i];
                                try {
                                selected.push(viewport.convertToPdfPoint(r.left - pageRect.x, r.top - pageRect.y).concat(
                                    viewport.convertToPdfPoint(r.right - pageRect.x, r.bottom - pageRect.y))); 
                                } catch(e) { }
                            }
                            // var selected = selectionRects.map(function (r) {
                            //   viewport.convertToPdfPoint(r.left - pageRect.x, r.top - pageRect.y).concat(
                            //      viewport.convertToPdfPoint(r.right - pageRect.x, r.bottom - pageRect.y)); 
                            // });
                            s_range = { page: pageIndex, coords: selected };
                        } else {
                            var range = window.getSelection().getRangeAt(0);
                            var preSelectionRange = range.cloneRange();
                            preSelectionRange.selectNodeContents(document);
                            preSelectionRange.setEnd(range.startContainer, range.startOffset);
                            var start = preSelectionRange.toString().length;
                            s_range = {
                                start: start,
                                end: start + range.toString().length
                            };
                        }
                        debugger
                        var output = {
                            content: window.getSelection().toString(),
                            code: tag_name,
                            document: document.title,
                            doc_url:   (window.location.href.match(/\.pdf$/) === null) ? window.location.href : window.location.href.replace("chrome-extension://nbimgbgchmccioidaopfhokkongfhkoe/",""),
                            email: user.email,
                            range: JSON.stringify(s_range),
                            time: moment().format('MM/DD/YYYY HH:mm:ss')
                        }

                        chrome.runtime.sendMessage({
                                contentScriptQuery: "recordContent",
                                data: output,
                                method: 'POST'
                        }, function(result) {
                            var kbshortcutdiv = shadowRootPopup.getElementById('kbshortcutdiv')
                            $(kbshortcutdiv).hide()
                            if (result.success) {
                                load_navigator()
                                markText(output.content, btn_color.value, s_range);
                                chrome.runtime.sendMessage({
                                    contentScriptQuery: "getTags",
                                }, function(result) {
                                    if (result !== undefined) {
                                        shadowRootPopup.getElementById('search-results').innerHTML = '';
                                        shadowRootPopup.getElementById('spinner').style = "display: none;";
                                        result.forEach(element => {
                                            searchResultContents(element);
                                        })
                                    } else {
                                        shadowRootPopup.getElementById('spinner').innerHTML = '<h5> Something is wrong. Please try again by refreshing the page.</h5>';
                                    }
                                });
                            }
                        })
                    })
            } else {
                console.log('no selection!');
            }

        }
        btn_color.onchange = function(e) {
            $('.fluid-overlay').show();
            var ri = this.getAttribute('range_index')
            btn_tag.style = `color: ${this.value};`
            var output_tags = {
                tags: tag_name.title,
                color: this.value,
                index: element[2],
                miro_color: element[3],
                researcher: element[4],
                time: moment().format('MM/DD/YYYY HH:mm:ss')

            }
            chrome.runtime.sendMessage({
                    contentScriptQuery: "updateTags",
                    data: output_tags,
                    range: 'A' + ri + ':' + 'F' + ri
                },
                function(result) {
                    if (result.success) {
                        chrome.runtime.sendMessage({
                                contentScriptQuery: "getContent"
                            },
                            function(contents) {
                                contents.forEach(content => {
                                    if (content[1].indexOf(output_tags.tags) >= 0) {
                                        markText(content[0], output_tags.color, content[6]);
                                    } else {
                                        console.log("not matched");
                                        $('.fluid-overlay').hide();
                                    }
                                });
                            });
                    }
                })
        }
        btn_visibility.onclick = function() {
            $('.fluid-overlay').show();
            let tag = this.parentElement.children[4].title;
            let tag_color = this.getAttribute('tag-color');
            if (this.innerText == "visibility") {
                this.innerText = 'visibility_off';
                removeHighlight(tag_color);
            } else {
                this.innerText = 'visibility';
                chrome.runtime.sendMessage({
                        contentScriptQuery: "getContent"
                    },
                    function(contents) {
                        contents.forEach(content => {
                            if (content[1].indexOf(tag) >= 0 && content[5] == window.location.href.replace("chrome-extension://nbimgbgchmccioidaopfhokkongfhkoe/","")) {
                                markText(content[0], tag_color, content[6]);
                                return true;
                            }
                        });
                        $('.fluid-overlay').hide();
                    });
            }
        }
    })
    
}

function generateTagUI1(element, i) {
    console.log("Tag generated!");
    var divider = document.createElement('div');
    divider.className = 'tag-and-divider';
    //divider.title = element[0];
    var container = document.createElement('div');
    container.className = 'main-tag';
    //container.title = element[0];
    divider.appendChild(container);
    var content = document.createElement('div');
    content.className = 'tag';
    //content.title = element[0];
    container.appendChild(content);
    var btn_tag = document.createElement('span');
    btn_tag.className = 'material-icons-outlined select-tag-button';
    btn_tag.title = "Tag";
    btn_tag.innerText = 'label';
    btn_tag.style = `color: ${element[1]};`
    content.appendChild(btn_tag);
    var btn_color = document.createElement('input');
    btn_color.setAttribute("type", "color");
    btn_color.className = 'change-color-input1';
    btn_color.hidden = 'hidden'
    btn_color.value = element[1];
    btn_color.title = "Color";
    $(btn_color).css('display','none !important')
    btn_color.setAttribute('range_index', i);
    content.appendChild(btn_color);
    var btn_visibility = document.createElement('span');
    btn_visibility.className = 'material-icons-outlined toggle-visibility-button1';
    btn_visibility.title = "Show/Hide";
    btn_visibility.innerText = 'visibility';
    btn_visibility.setAttribute('tag-color', element[1]);
    content.appendChild(btn_visibility);
    var btn_pin = document.createElement('span');
    btn_pin.className = 'material-icons pin-tag-button1';
    btn_pin.title = element[2];
    btn_pin.innerText = 'push_pin';
    content.appendChild(btn_pin);
    var tag_name = document.createElement('span');
    tag_name.className = 'tag-name1';
    tag_name.title = element[0];
    if(element[0].length > 15) {
        tag_name.innerText = element[0].slice(0,15)+'...';
    } else {
        tag_name.innerText = element[0];
    }
    content.appendChild(tag_name);
    var btn_more = document.createElement('span');
    btn_more.className = 'material-icons more-options-button1';
    btn_more.title = "Tag options";
    btn_more.innerText = 'more_vert';
    btn_more.onclick = function() {
        const elements = shadowRootPopup.querySelectorAll('.popup-menu');
        if (elements != null) {
            if (elements.length > 0) {
                elements.forEach(element => {
                    // if(element.title != this.title){
                    element.parentNode.removeChild(element);
                    // }
                })
            } else {
                // popup menu
                var popup_menu = document.createElement('div');
                popup_menu.className = 'popup-menu';
                popup_menu.id="popup-menu-id";
                popup_menu.title = element[0];

                var rename_tag = document.createElement('div');
                rename_tag.className = 'rename-tag dropdown-item';
                var icon_span = document.createElement('span');
                icon_span.className = 'material-icons-outlined popup-icon';
                icon_span.innerText = 'mode_edit';
                rename_tag.appendChild(icon_span);
                var name_span = document.createElement('span');
                name_span.className = 'popup-name';
                name_span.innerText = 'Rename';
                rename_tag.appendChild(name_span);
                rename_tag.onclick = function() {
                    var modal = shadowRootPopup.getElementById('rename-modal');
                    modal.style = 'display: block;';
                    
                    var popup_menu = shadowRootPopup.getElementById('popup-menu-id');
                    popup_menu.style.display = 'none';
                    var rename_input = shadowRootPopup.getElementById('rename-modal-input');
                    var btn_save = shadowRootPopup.getElementById('rename-tag-button');
                    rename_input.value = element[0];
                    var prev_tagname = element[0];
                    btn_save.setAttribute('range_index', i);
                    rename_input.onkeyup = function() {
                        btn_save.disabled = this.value === element[0] ? true : false;
                    }
                    btn_save.onclick = function() {
                        btn_save.innerText = 'Saving...'
                        btn_save.disabled = true;
                        
                        var ri = this.getAttribute('range_index');

                        var output_tags = {
                            tag: rename_input.value,
                            color: element[1],
                            index: element[2],
                            miro_color: element[3],
                            researcher: element[4],
                            time: moment().format('MM/DD/YYYY HH:mm:ss')
                        }
                        chrome.runtime.sendMessage({
                            contentScriptQuery: "updateTags",
                            data: output_tags,
                            range: 'A' + ri + ':' + 'F' + ri
                        }, function(result) {
                            if (result.success) {
                                modal.style = 'display: none;';
                                chrome.runtime.sendMessage({
                                    contentScriptQuery: "getTags",
                                }, function(result) {
                                    if (result !== undefined) {
                                        chrome.runtime.sendMessage({
                                            contentScriptQuery: "getContent"
                                        }, function(contents) {
                                            var tempContents = [];
                                            var ind = 1;
                                            if(contents != null) {
                                                contents.forEach(content => {
                                                    ind++;
                                                    if(content[1] === prev_tagname) {
                                                        var tt = content;
                                                        tt.ind = ind;
                                                        tempContents.push(tt);
                                                    }
                                                });
                                                tempContents.forEach(content => {
                                                    var temp = content;
                                                    temp[1] = rename_input.value;
                                                    var output = {
                                                        content: temp[0],
                                                        code: temp[1],
                                                        document: temp[3],
                                                        doc_url: temp[5],
                                                        email: temp[2],
                                                        range: temp[6],
                                                        time: moment().format('MM/DD/YYYY HH:mm:ss')
                                                    }

                                                    chrome.runtime.sendMessage({
                                                        contentScriptQuery: "deleteContent",
                                                        index: content.ind
                                                    }, function(result) {
                                                        if (result.success) {
                                                            chrome.runtime.sendMessage({
                                                                contentScriptQuery: "recordContent",
                                                                data: output,
                                                                method: 'POST'
                                                            },
                                                            function(result) {
                                                                load_navigator()
                                                                var kbshortcutdiv = shadowRootPopup.getElementById('kbshortcutdiv')
                                                                $(kbshortcutdiv).hide()
                                                                if (result.success) {
                                                                }
                                                            })
                                                        }
                                                    });
                                                })
                                            }
                                        });
                                        shadowRootPopup.getElementById('search-results').innerHTML = '';
                                        var taglist = shadowRootPopup.getElementById('tag-list-1');
                                        var childs = shadowRootPopup.querySelectorAll('.tag-and-divider')
                                        childs.forEach(child => {
                                            taglist.removeChild(child);
                                            taglist1.removeChild(child);
                                        });
                                        shadowRootPopup.getElementById('spinner').style = "display: none;";
                                        var i = 1;
                                        result.forEach(element => {
                                            i++;
                                            generateTagUI(element, i);
                                            generateTagUI1(element, i);
                                            searchResultContents(element);
                                        })
                                    } else {
                                        shadowRootPopup.getElementById('spinner').innerHTML = '<h5> Something is wrong. Please try again by refreshing the page.</h5>';
                                    }
                                })
                            }
                        })

                    }
                }
                popup_menu.appendChild(rename_tag);
                var change_color_tag = document.createElement('div');
                change_color_tag.className = 'change-color dropdown-item';
                var icon_span = document.createElement('span');
                icon_span.className = 'material-icons-outlined popup-icon';
                icon_span.innerText = 'color_lens';
                change_color_tag.appendChild(icon_span);
                var name_span = document.createElement('span');
                name_span.className = 'popup-name';
                name_span.innerText = 'Change color';
                change_color_tag.appendChild(name_span);
                change_color_tag.onclick = function() {
                    var popup_menu = shadowRootPopup.getElementById('popup-menu-id');
                    popup_menu.style.display = 'none';
                    var modal = shadowRootPopup.getElementById('change-color-modal');
                    modal.style = 'display: block;';
                    var color_input = shadowRootPopup.getElementById('new-tag-color');
                    color_input.value = element[1];
                    var btn_save = shadowRootPopup.getElementById('change-tag-color');
                    btn_save.setAttribute('range_index', i);
                    color_input.onchange = function() {
                        btn_save.disabled = this.value === element[1] ? true : false;
                    }
                    btn_save.onclick = function() {
                        $('.fluid-overlay').show();
                        btn_save.innerText = 'Saving...'
                        btn_save.disabled = true;
                        var ri = this.getAttribute('range_index');
                        var output_tags = {
                            tags: tag_name.title,
                            color: color_input.value,
                            index: element[2],
                            miro_color: element[3],
                            researcher: element[4],
                            time: moment().format('MM/DD/YYYY HH:mm:ss')

                        }
                        chrome.runtime.sendMessage({
                                contentScriptQuery: "updateTags",
                                data: output_tags,
                                range: 'A' + ri + ':' + 'F' + ri
                            },
                            function(result) {
                                if (result.success) {
                                    btn_color.value = color_input.value;
                                    btn_tag.style = `color: ${color_input.value};`
                                    modal.style = 'display: none;';
                                    chrome.runtime.sendMessage({
                                            contentScriptQuery: "getContent"
                                        },
                                        function(contents) {
                                            if(contents != null) {
                                                contents.forEach(content => {
                                                    if (content[1].indexOf(output_tags.tags) >= 0) {
                                                        markText(content[0], output_tags.color, content[6]);
                                                    } else {
                                                        console.log("not matched");
                                                        $('.fluid-overlay').hide();
                                                    }
                                                });
                                            }
                                        });
                                }
                            })

                    }
                }
                popup_menu.appendChild(change_color_tag);

                var popup_divider = document.createElement('div');
                popup_divider.className = 'dropdown-divider popup-divider';
                popup_menu.appendChild(popup_divider);

                var delete_tag = document.createElement('div');
                delete_tag.className = 'delete-tag dropdown-item';
                var icon_span = document.createElement('span');
                icon_span.className = 'material-icons-outlined popup-icon';
                icon_span.innerText = 'delete';
                delete_tag.appendChild(icon_span);
                var name_span = document.createElement('span');
                name_span.className = 'popup-name';
                name_span.innerText = 'Delete';
                delete_tag.appendChild(name_span);
                delete_tag.onclick = function() {
                    var popup_menu = shadowRootPopup.getElementById('popup-menu-id');
                    popup_menu.style.display = 'none';
                    const elements = shadowRootPopup.querySelectorAll('.del-modal');
                    if (elements != null) {
                        if (elements.length > 0) {
                            elements.forEach(element => {
                                element.parentNode.removeChild(element);
                            });
                        } else {
                            // delete modal
                            var del_modal = document.createElement('div');
                            del_modal.className = 'modal-shadow del-modal';
                            del_modal.id = 'delete-tag-modal';
                            var del_modal_content = document.createElement('div');
                            del_modal_content.className = 'modal-shadow-content';
                            del_modal.appendChild(del_modal_content);
                            var del_modal_header = document.createElement('div');
                            del_modal_header.className = 'modal-shadow-header';
                            del_modal_header.innerText = 'Delete tag';
                            del_modal_content.appendChild(del_modal_header);
                            var div_d = document.createElement('div');
                            div_d.innerText = 'This code will be deleted for everyone tagging this document!';
                            del_modal_content.appendChild(div_d);
                            var close_span = document.createElement('span');
                            close_span.className = 'material-icons close-modal';
                            close_span.innerText = 'close';
                            close_span.onclick = function(e) {
                                var element = shadowRootPopup.getElementById('delete-tag-modal');
                                element.parentElement.removeChild(element);
                            }
                            del_modal_content.appendChild(close_span);
                            var footer_button = document.createElement('div');
                            footer_button.className = 'modal-shadow-buttons';
                            var btn_delete = document.createElement('button');
                            btn_delete.className = 'btn btn-primary btn-sm save-modal-button';
                            btn_delete.title = 'Delete';
                            btn_delete.innerText = 'Delete';
                            btn_delete.setAttribute('index', i);
                            btn_delete.setAttribute('color', element[1]);
                            btn_delete.setAttribute('tag', element[0]);
                            btn_delete.onclick = function() {
                                $('.fluid-overlay').show();
                                let color = this.getAttribute('color');
                                let ztag = this.getAttribute('tag');
                                chrome.runtime.sendMessage({
                                        contentScriptQuery: "deleteTag",
                                        index: this.getAttribute('index')
                                    },
                                    function(result) {
                                        if (result.success) {
                                            shadowRootPopup.getElementById('search-results').innerHTML = '';
                                            var taglist = shadowRootPopup.getElementById('tag-list-1');
                                            var childs = shadowRootPopup.querySelectorAll('.tag-and-divider')
                                            childs.forEach(child => {
                                                taglist.removeChild(child);
                                                taglist1.removeChild(child);
                                            });
                                            chrome.runtime.sendMessage({
                                                    contentScriptQuery: "getTags",
                                                },
                                                function(result) {
                                                    var j = 1;
                                                    result.forEach(element => {
                                                        j++;
                                                        generateTagUI(element, j);
                                                        generateTagUI1(element, j);
                                                        searchResultContents(element);
                                                        removeHighlight(color);
                                                    })
                                                });

                                            // delete respected contents of that tag
                                            chrome.runtime.sendMessage({
                                                    contentScriptQuery: "getContent"
                                                },
                                                function(contents) {
                                                    var ti = 1;
                                                    contents.forEach(content => {
                                                        ti++;
                                                        if (content[1].indexOf(ztag) >= 0) {
                                                            chrome.runtime.sendMessage({
                                                                    contentScriptQuery: "deleteContent",
                                                                    index: ti
                                                                },
                                                                function(result) {
                                                                    if (result.success) {
                                                                        console.log('content deleted!')
                                                                    }
                                                                });
                                                        } else {
                                                            console.log("not matched");
                                                            $('.fluid-overlay').hide();
                                                        }
                                                    });
                                                });
                                        }
                                    });
                            }
                            footer_button.appendChild(btn_delete);
                            var btn_cancel = document.createElement('button');
                            btn_cancel.className = 'btn btn-outline-primary btn-sm close-modal-button';
                            btn_cancel.title = 'Cancel';
                            btn_cancel.innerText = 'Cancel';
                            btn_cancel.onclick = function() {
                                var element = shadowRootPopup.getElementById('delete-tag-modal');
                                element.parentElement.removeChild(element);
                            }
                            footer_button.appendChild(btn_cancel);

                            del_modal_content.appendChild(footer_button);
                            // end delete modal
                            content.appendChild(del_modal);
                        }
                    }
                }
                popup_menu.appendChild(delete_tag);
                // end popup menu
                content.appendChild(popup_menu);
            }
        }
    }
    content.appendChild(btn_more);
    var hr = document.createElement('hr');
    divider.appendChild(hr);
    shadowRootPopup.getElementById('tag-list-1').appendChild(divider);
    btn_tag.onclick = function() {
        if (window.selection_buffer.length > 0) {
            $('.fluid-overlay').show();
            var tag_name = this.parentElement.children[4].title;
            chrome.runtime.sendMessage({
                    contentScriptQuery: "getUser",
                }, function(user) {
                    console.log(user);
                    var s_range;
                    if(window.location.href.match(/\.pdf$/)) {
                        var pageIndex = PDFViewerApplication.pdfViewer.currentPageNumber - 1; 
                        var page = PDFViewerApplication.pdfViewer.getPageView(pageIndex);
                        var pageRect = page.canvas.getClientRects()[0];
                        var selectionRects = window.getSelection().getRangeAt(0).getClientRects();
                        var selectionRectList = [];
                        i=0;
                        while(1) {
                            if(selectionRects[i+1]==undefined) {
                                selectionRectList.push(selectionRects[i]);
                                break;
                            }
                            if(selectionRects[i].x == selectionRects[i+1].x && selectionRects[i].width == selectionRects[i+1].width) {
                                selectionRects[i] = compare(selectionRects[i], selectionRects[i+1]);
                                selectionRects[i+1] = compare(selectionRects[i], selectionRects[i+1]);
                                selectionRectList.push(selectionRects[i]);
                                i++;
                            } else {
                                selectionRectList.push(selectionRects[i]);
                            }
                            i++;
                        }
                        var viewport = page.viewport;
                        var selected = [];
                        for(i=0;i<selectionRectList.length;i++) {
                            r = selectionRectList[i];
                            try {
                            selected.push(viewport.convertToPdfPoint(r.left - pageRect.x, r.top - pageRect.y).concat(
                                viewport.convertToPdfPoint(r.right - pageRect.x, r.bottom - pageRect.y))); 
                            } catch(e) { }
                        }
                        // var selected = selectionRects.map(function (r) {
                        //   viewport.convertToPdfPoint(r.left - pageRect.x, r.top - pageRect.y).concat(
                        //      viewport.convertToPdfPoint(r.right - pageRect.x, r.bottom - pageRect.y)); 
                        // });
                        s_range = { page: pageIndex, coords: selected };
                    } else {
                        var range = window.getSelection().getRangeAt(0);
                        var preSelectionRange = range.cloneRange();
                        preSelectionRange.selectNodeContents(document);
                        preSelectionRange.setEnd(range.startContainer, range.startOffset);
                        var start = preSelectionRange.toString().length;
                        s_range = {
                            start: start,
                            end: start + range.toString().length
                        };
                    }
                    var output = {
                        content: window.getSelection().toString(),
                        code: tag_name,
                        document: document.title,
                        doc_url:   (window.location.href.match(/\.pdf$/) === null) ? window.location.href : window.location.href.replace("chrome-extension://nbimgbgchmccioidaopfhokkongfhkoe/",""),
                        email: user.email,
                        range: JSON.stringify(s_range),
                        time: moment().format('MM/DD/YYYY HH:mm:ss')
                    }

                    chrome.runtime.sendMessage({
                            contentScriptQuery: "recordContent",
                            data: output,
                            method: 'POST'
                    }, function(result) {
                        var kbshortcutdiv = shadowRootPopup.getElementById('kbshortcutdiv')
                        $(kbshortcutdiv).hide()
                        if (result.success) {
                            load_navigator()
                            markText(output.content, btn_color.value, s_range);
                            chrome.runtime.sendMessage({
                                contentScriptQuery: "getTags",
                            }, function(result) {
                                if (result !== undefined) {
                                    shadowRootPopup.getElementById('search-results').innerHTML = '';
                                    shadowRootPopup.getElementById('spinner').style = "display: none;";
                                    result.forEach(element => {
                                        searchResultContents(element);
                                    })
                                } else {
                                    shadowRootPopup.getElementById('spinner').innerHTML = '<h5> Something is wrong. Please try again by refreshing the page.</h5>';
                                }
                            });
                        }
                    })
                })
        } else {
            console.log('no selection!');
        }

    }
    btn_color.onchange = function(e) {
        $('.fluid-overlay').show();
        var ri = this.getAttribute('range_index')
        btn_tag.style = `color: ${this.value};`
        var output_tags = {
            tags: tag_name.title,
            color: this.value,
            index: element[2],
            miro_color: element[3],
            researcher: element[4],
            time: moment().format('MM/DD/YYYY HH:mm:ss')

        }
        chrome.runtime.sendMessage({
                contentScriptQuery: "updateTags",
                data: output_tags,
                range: 'A' + ri + ':' + 'F' + ri
            },
            function(result) {
                if (result.success) {
                    chrome.runtime.sendMessage({
                            contentScriptQuery: "getContent"
                        },
                        function(contents) {
                            contents.forEach(content => {
                                if (content[1].indexOf(output_tags.tags) >= 0) {
                                    markText(content[0], output_tags.color, content[6]);
                                } else {
                                    console.log("not matched");
                                    $('.fluid-overlay').hide();
                                }
                            });
                        });
                }
            })
    }
    btn_visibility.onclick = function() {
        $('.fluid-overlay').show();
        let tag = this.title;
        let tag_color = this.getAttribute('tag-color');
        if (this.innerText == "visibility") {
            this.innerText = 'visibility_off';
            removeHighlight(tag_color);
        } else {
            this.innerText = 'visibility';
            chrome.runtime.sendMessage({
                    contentScriptQuery: "getContent"
                },
                function(contents) {
                    contents.forEach(content => {
                        if (content[1].indexOf(tag) >= 0 && content[5] == window.location.href.replace("chrome-extension://nbimgbgchmccioidaopfhokkongfhkoe/","")) {
                            markText(content[0], tag_color, content[6]);
                            return true;
                        }
                    });
                    $('.fluid-overlay').hide();
                });
        }
    }
}


function getTagOptions() {
    shadowRootPopup.getElementById('tag-search-bar').innerHTML = '';
    console.log("Get Tag Options");
    chrome.runtime.sendMessage({
            contentScriptQuery: "getTags"
        },
        function(tags) {
            $.each(tags, function(index, tag) {
                var option = document.createElement('option');
                option.className = 'tag-option';
                option.title = tag[0];
                option.innerText = tag[0];
                shadowRootPopup.getElementById('tag-search-bar').appendChild(option);
            });
        })

}

function getDocumentOptions() {
    var array = [];
    shadowRootPopup.getElementById('doc-search-bar').innerHTML = '';
    chrome.runtime.sendMessage({
            contentScriptQuery: "getContent"
        },
        function(contents) {
            if (contents != null || contents != undefined) {
                contents.forEach(content => {
                    array[content[3]] = content[1];
                });
                const oneDArray = contents.map(content => {
                    return content[3];
                })
                var unique = oneDArray.filter((x, y) => oneDArray.indexOf(x) == y);
                $.each(unique, function(index, content) {

                    var option = document.createElement('option');
                    option.className = 'doc-option';
                    option.title = array[content];
                    option.innerText = content;
                    shadowRootPopup.getElementById('doc-search-bar').appendChild(option);
                });
            }
        })
}

function searchResultContents(tag) {
    var tag_div = document.createElement('div');
    tag_div.className = 'tag-div';
    tag_div.title = tag[0];

    var tag_header = document.createElement('div');
    tag_header.className = 'tag-header';
    tag_header.title = tag[0];
    tag_div.appendChild(tag_header);

    var span_icon = document.createElement('span');
    span_icon.className = 'material-icons-outlined expand-icon';
    span_icon.title = tag[0];
    span_icon.innerText = 'horizontal_rule';
    tag_header.appendChild(span_icon);
    var span_name = document.createElement('span');
    span_name.className = 'tag-name-content';
    span_name.title = tag[0];
    span_name.innerText = tag[0];
    tag_header.appendChild(span_name);

    var tag_content = document.createElement('div');
    tag_content.className = 'tag-content';
    tag_content.title = tag[0];
    tag_content.style = 'display: none;';
    chrome.runtime.sendMessage({
            contentScriptQuery: "getContent"
        },
        function(contents) {
            var i = 1;
            if(contents !== null) {
                contents.forEach(content => {
                i++;
                if (content[1] == tag[0]) {
                    var doc_div = document.createElement('div');
                    doc_div.className = 'doc-div';
                    doc_div.title = content[3];
                    var divider = document.createElement('div');
                    divider.className = 'dropdown-divider tag-content-divider-line';
                    doc_div.appendChild(divider);
                    var tag_cont = document.createElement('div');
                    tag_cont.className = 'tagged-content';
                    tag_cont.title = content[3];
                    var tag_txt = document.createElement('div');
                    tag_txt.className = 'tagged-text';
                    tag_txt.title = content[3];
                    tag_txt.innerHTML = content[0];
                    tag_cont.appendChild(tag_txt);
                    // delete modal
                    var del_modal = document.createElement('div');
                    del_modal.className = 'modal-shadow';
                    var del_modal_content = document.createElement('div');
                    del_modal_content.className = 'modal-shadow-content';
                    del_modal.appendChild(del_modal_content);
                    var del_modal_header = document.createElement('div');
                    del_modal_header.className = 'modal-shadow-header';
                    del_modal_header.innerText = 'Delete tag';
                    del_modal_content.appendChild(del_modal_header);
                    var div_d = document.createElement('div');
                    div_d.innerText = 'This text will be untagged for everyone tagging this document!';
                    del_modal_content.appendChild(div_d);
                    var close_span = document.createElement('span');
                    close_span.className = 'material-icons close-modal';
                    close_span.innerText = 'close';
                    close_span.onclick = function() {
                        del_modal.style = 'display: none;';
                    }
                    del_modal_content.appendChild(close_span);
                    var footer_button = document.createElement('div');
                    footer_button.className = 'modal-shadow-buttons';
                    var btn_delete = document.createElement('button');
                    btn_delete.className = 'btn btn-primary btn-sm save-modal-button';
                    btn_delete.title = 'Delete';
                    btn_delete.innerText = 'Delete';
                    btn_delete.setAttribute('index', i);
                    btn_delete.setAttribute('color', tag[1]);
                    btn_delete.setAttribute('content', content[0]);
                    btn_delete.onclick = function() {
                        $('.fluid-overlay').show();
                        let color = this.getAttribute('color');
                        let content = this.getAttribute('content');
                        chrome.runtime.sendMessage({
                                contentScriptQuery: "deleteContent",
                                index: this.getAttribute('index')
                            },
                            function(result) {
                                if (result.success) {
                                    shadowRootPopup.getElementById('search-results').innerHTML = '';
                                    console.log("Delete button clicked");
                                    chrome.runtime.sendMessage({
                                            contentScriptQuery: "getTags",
                                        },
                                        function(result) {
                                            result.forEach(element => {
                                                searchResultContents(element);
                                                removeTagHighlight(content, color);
                                            })
                                        })

                                }
                            });
                    }
                    footer_button.appendChild(btn_delete);
                    var btn_cancel = document.createElement('button');
                    btn_cancel.className = 'btn btn-outline-primary btn-sm close-modal-button';
                    btn_cancel.title = 'Cancel';
                    btn_cancel.innerText = 'Cancel';
                    btn_cancel.onclick = function() {
                        del_modal.style = 'display: none;';
                    }
                    footer_button.appendChild(btn_cancel);
                    del_modal_content.appendChild(footer_button);
                    // end delete modal
                    var del_span = document.createElement('span');
                    del_span.className = 'material-icons-outlined delete-tagged-content';
                    del_span.title = 'Delete';
                    del_span.setAttribute('index', i);
                    del_span.setAttribute('color', tag[1]);
                    del_span.setAttribute('content', content[0]);
                    del_span.innerHTML = 'delete';
                    del_span.onclick = function() {
                        del_modal.style = 'display: block;';
                    }
                    tag_cont.appendChild(del_span);
                    doc_div.appendChild(del_modal);
                    doc_div.appendChild(tag_cont);

                    var doc_header = document.createElement('div');
                    doc_header.className = 'doc-header';
                    var book_icon = document.createElement('span');
                    book_icon.className = 'material-icons doc-icon';
                    book_icon.innerText = 'book';
                    doc_header.appendChild(book_icon);
                    var doc_name = document.createElement('span');
                    doc_name.className = 'doc-name';
                    doc_name.innerText = content[3];
                    doc_header.appendChild(doc_name);
                    doc_div.appendChild(doc_header);

                    doc_div.onmouseover = function() {
                        del_span.style = 'display: block;';
                    }
                    doc_div.onmouseout = function() {
                        del_span.style = 'display: none;';
                    }
                    tag_content.appendChild(doc_div);
                }
                })
            }
        })

    tag_header.onclick = function() {
        if (span_icon.innerText === "horizontal_rule") {
            span_icon.innerText = 'expand_more';
            tag_content.style = 'display: block;';
        } else {
            span_icon.innerText = 'horizontal_rule';
            tag_content.style = 'display: none;';
        }

    }
    tag_div.appendChild(tag_content);
    shadowRootPopup.getElementById('search-results').appendChild(tag_div);
}

function loadKeywordLibs() {
    list = shadowRootPopup.getElementById('library-list');
    chrome.runtime.sendMessage({
            contentScriptQuery: "getLibrary",
        },
        function(result) {
            if (result != undefined || result != null) {
                result.forEach(lib => {
                    var option = document.createElement('option');
                    option.classList = 'auto-library-text';
                    option.innerText = lib[0];
                    lib.shift();
                    option.value = lib.join(',');
                    list.appendChild(option);
                });
                shadowRootPopup.querySelectorAll('.auto-library-text').forEach(auto => {
                    auto.onclick = function() {
                        shadowRootPopup.getElementById('keyword-input').value = this.value;
                    }
                })
            }
        });
}

function getPdfSelectedText() {
    return new Promise(resolve => {
      window.addEventListener('message', function onMessage(e) {
        if (e.origin === 'chrome-extension://mhjfbmdgcfjbbpaeojofohoefgiehjai' &&
            e.data && e.data.type === 'getSelectedTextReply') {
          window.removeEventListener('message', onMessage);
          resolve(e.data.selectedText);
        }
      });
      // runs code in page context to access postMessage of the embedded plugin
      const script = document.createElement('script');
      if (chrome.runtime.getManifest().manifest_version > 2) {
        script.src = chrome.runtime.getURL('query-pdf.js');
      } else {
        script.textContent = `(${() => {
          document.querySelector('embed').postMessage({type: 'getSelectedText'}, '*');
        }})()`;
      }
      document.documentElement.appendChild(script);
      script.remove();
    });
  }

  function compare(first, second) {
      var result = first;
      if(first.height > second.height) {
        result.width = second.width;
      } else {
          result.height = second.height;
      }
      return result;
  }