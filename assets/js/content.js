var selection_buffer = null;
var kbshortcutmode = false;
chrome.storage.local.get('popup', res => {
    if (res.popup) {
        slide()
        // $('#shadow-wrapper-popup-eathu').slideToggle("slow");
    }
})
const BACKGROUND_COLORS = [ // List of accepted background colors in Miro
    "#fff9b1", // - Yellow: 
    "#f5f6f8", // - White: 
    "#f5d128", // - Light Orange: 
    "#d0e17a", // - Olive: 
    "#d5f692", // - Green: 
    "#a6ccf5", // - Pastel Blue: 
    "#67c6c0", // - Aqua:
    "#23bfe7", // - Blue: 
    "#ff9d48", // - Orange: 
    "#ea94bb", // - Pink: 
    "#f16c7f", // - Red: 
    "#b384bb"  // - Purple: 
  ];
// Global variable
// Modal popup
chrome.runtime.onMessage.addListener(function(msg, sender) {
    switch (msg) {
        case "toggle":
            slide()
            break;
        case "loader":
            $('body').prepend(`<div class="fluid-overlay"><div class="overlay-logo"><i class="js-spin icn-spinner"><img src="${overlay_big_spinner}"/></i></div></div>`);    
            $('.fluid-overlay').show();
            break;
    }
});

function controlSidePanel(padding) {
    $('body').css('padding-right', padding+'px');
    //$('header').css('padding-right', padding+'px');
    $('footer').css('padding-right', padding+'px');
}

function slide() {
    var _slideMenu = $("#shadow-wrapper-popup-eathu");
    if (_slideMenu.hasClass("slide-opened")) {
        controlSidePanel(0)
        shadowRootPopup.querySelectorAll('.more-options-button').forEach(materialicon => {
            $(materialicon).hide()
        })
        $(shadowRootPopup.getElementById('content-more-option')).hide()
        _slideMenu[0].style.width = '0'
        kbshortcutmode = true
    } else {
        var width = 350
        if(shadowRootPopup.getElementById('segment-tab').style.display != "none") {
            width = 700
        }
        //if(shadowRootPopup.getElementById('collapse-expand-button').getAttribute('type') == 'show') {
        controlSidePanel(width)
        kbshortcutmode = false
        // } else {
        //     $('body').css('padding-right', '100px');
        // }
        shadowRootPopup.querySelectorAll('.more-options-button').forEach(materialicon => {
            $(materialicon).show()
        })
        $(shadowRootPopup.getElementById('content-more-option')).show()
        _slideMenu[0].style.width = (width+'px')
    }
    _slideMenu.toggleClass("slide-opened");
}

document.onmouseup = document.onkeyup = function() {
    window.selection_buffer = (window.location.href.match(/\.pdf$/) === null) ? getSelectedText() : getSelectionHtml();
    //console.log(window.selection_buffer);
};
if ("undefined" == typeof jQuery) {
    var jq = document.createElement("script");
    jq.src = "https://code.jquery.com/ui/1.10.4/jquery-ui.js", document.getElementsByTagName("head")[0].appendChild(jq);
}
var jqryinvl = setInterval(function() {
    if ("undefined" != typeof jQuery) {
        clearInterval(jqryinvl);
    }
}, 200);

// (function($) {
//     $.fn.drags = function(opt) {

//         opt = $.extend({handle:"",cursor:""}, opt);

//         if(opt.handle === "") {
//             var $el = this;
//         } else {
//             var $el = this.find(opt.handle);
//         }

//         return $el.css('cursor', opt.cursor).on("mousedown", function(e) {
//             if(opt.handle === "") {
//                 var $drag = $(this).addClass('draggable');
//             } else {
//                 var $drag = $(this).addClass('active-handle').parent().addClass('draggable');
//             }
//             var z_idx = $drag.css('z-index'),
//                 drg_h = $drag.outerHeight(),
//                 drg_w = $drag.outerWidth(),
//                 pos_y = $drag.offset().top + drg_h - e.pageY,
//                 pos_x = $drag.offset().left + drg_w - e.pageX;
//             $drag.css('z-index', 999999999).parents().on("mousemove", function(e) {
//                 $('.draggable').offset({
//                     top:e.pageY + pos_y - drg_h,
//                     left:e.pageX + pos_x - drg_w
//                 }).on("mouseup", function() {
//                     $(this).removeClass('draggable').css('z-index', z_idx);
//                 });
//             });
//             //e.preventDefault(); // disable selection
//         }).on("mouseup", function() {
//             if(opt.handle === "") {
//                 $(this).removeClass('draggable');
//             } else {
//                 $(this).removeClass('active-handle').parent().removeClass('draggable');
//             }
//         });

//     }
// })(jQuery);

init();
function init() {
    chrome.runtime.sendMessage({
        contentScriptQuery: "getSheetInfo",
    }, function(object) {
        appendStyles();
        loadPopup(object);
        getTagOptions();
        getDocumentOptions();
        loadKeywordLibs();
        if(object!=undefined) {
            chrome.runtime.sendMessage({
                contentScriptQuery: "get-status"
            }, function(result) {
                if(result.response[0] == 1){
                    slide()
                } else {
                    var _slideMenu = $("#shadow-wrapper-popup-eathu");
                    _slideMenu[0].className = "slide-opened"
                    slide()
                }
            })
        }

        //$('#shadow-wrapper-popup-eathu').drags()

        // if(object!=undefined) {
        //     chrome.runtime.sendMessage({
        //         contentScriptQuery: "getKeyShortcut",
        //     }, function(response) {
        //         $('body').prepend(`<div class="shortcut-overlay"><div class="shortcut-overlay-logo"><i class="js-spin icn-spinner"><img src="${overlay_small_spinner}"/></i></div></div>`);    
        //         if(response.response.keyShortcut != 1) {
        //             slide()
        //             // $('#shadow-wrapper-popup-eathu').slideToggle("slow"); 
        //             $(".shortcut-overlay").hide() 
        //         } else { 
        //             $(".shortcut-overlay").show()
        //          }
        //     })
        // }


        chrome.runtime.sendMessage({
            contentScriptQuery: "getContent",
        }, function(result) {
            if (result != null || result != undefined) {
                const url_array = result.map(content => {
                    return content[5];
                });
                var current_url = (window.location.href.match(/\.pdf$/) === null) ?  window.location.href : window.location.href.replace("chrome-extension://nbimgbgchmccioidaopfhokkongfhkoe/","");
                if(url_array.indexOf(current_url) >= 0) {
                    $('body').prepend(`<div class="fluid-overlay"><div class="overlay-logo"><i class="js-spin icn-spinner"><img src="${overlay_big_spinner}"/></i></div></div>`);
                }

                chrome.runtime.sendMessage({
                    contentScriptQuery: "getTags",
                }, function(tags) {
                    $.each(result, function(index, value) {
                        if (value[5] == current_url) {
                            $.each(tags, function(index, tag) {
                                if (tag[0] == value[1]) {
                                    var range;
                                    value[6] == '' ? range = '' : range = JSON.parse(value[6]);
                                    markText(value[0], tag[1], range);
                                }
                            })
                            return true;
                        }
                    })
                });
            }
        });

        chrome.runtime.sendMessage({
            contentScriptQuery: "getTags",
        }, function(result) {
            if (result != undefined || result != null) {
                shadowRootPopup.getElementById('spinner').style = "display: none;";
                var i = 1;
                result.forEach(element => {
                    i++;
                    generateTagUI(element, i);
                    generateTagUI1(element, i);
                    searchResultContents(element);
                })
            } else {
                shadowRootPopup.getElementById('spinner').style = "display: none;";
                //shadowRootPopup.getElementById('spinner').innerHTML = '<h5> Something is wrong. Please try again by refreshing the page.</h5>';
            }
        });

        shadowRootPopup.getElementById('search_tag').onkeyup = function() {
            var list = shadowRootPopup.getElementById('tag-list');
            var childs = list.childNodes;
            var i = 1;
            let tag_array = [];
            var value = this.value.toLowerCase()
            childs.forEach(child => {
                if (child.className == 'tag-and-divider') {
                    var title = child.children[0].children[0].children[4].title;
                    if (title !== undefined) {
                        title = title.toLowerCase();
                        //console.log(title.includes(value));
                        if (!title.includes(value)) {
                            i++;
                            child.style = "display: none;";
                            shadowRootPopup.getElementById('create-tag-button').disabled = (this.value.length > 0 ? false : true);
                        } else {
                            tag_array.push(title);
                            child.style = "display: block;";
                        }
                    }
                }
            });
            if (tag_array.indexOf(value) > -1) {
                shadowRootPopup.getElementById('create-tag-button').disabled = true;
            } else {
                shadowRootPopup.getElementById('create-tag-button').disabled = (this.value.length > 0 ? false : true);
            }
            if ((childs.length - 4) == i) {
                shadowRootPopup.getElementById('no-tags-message').style = "display: block;";
            } else {
                shadowRootPopup.getElementById('no-tags-message').style = "display: none;";
            }
        }

        shadowRootPopup.getElementById('search_tag_1').onkeyup = function() {
            var list = shadowRootPopup.getElementById('tag-list-1');
            var childs = list.childNodes;
            var i = 1;
            let tag_array = [];
            var value = this.value.toLowerCase()
            childs.forEach(child => {
                if (child.className == 'tag-and-divider') {
                    var title = child.children[0].children[0].children[4].title;
                    if (title !== undefined) {
                        title = title.toLowerCase();
                        //console.log(title.includes(value));
                        if (!title.includes(value)) {
                            i++;
                            child.style = "display: none;";
                            shadowRootPopup.getElementById('create-tag-button').disabled = (this.value.length > 0 ? false : true);
                        } else {
                            tag_array.push(title);
                            child.style = "display: block;";
                        }
                    }
                }
            });
            if (tag_array.indexOf(value) > -1) {
                shadowRootPopup.getElementById('create-tag-button').disabled = true;
            } else {
                shadowRootPopup.getElementById('create-tag-button').disabled = (this.value.length > 0 ? false : true);
            }
            if ((childs.length - 4) == i) {
                shadowRootPopup.getElementById('no-tags-message').style = "display: block;";
            } else {
                shadowRootPopup.getElementById('no-tags-message').style = "display: none;";
            }
        }

        shadowRootPopup.getElementById('closeContent').onclick = function() {
            slide()
        }

        shadowRootPopup.getElementById('create-tag-button').onclick = function() {
            const tag_name = shadowRootPopup.getElementById('search_tag').value;
            console.log("create-tag-button clicked");
            chrome.runtime.sendMessage({
                contentScriptQuery: "getUser"
            }, function(user) {
                console.log(user);
                chrome.runtime.sendMessage({
                    contentScriptQuery: "getTags",
                }, function(tags) {
                    console.log(tags);
                    const index = tags === null ? 1 : tags.length + 1;
                    var color = random_rgba();
                    var output_tags = {
                        tag: tag_name,
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
                    }, function() {
                        console.log("Tag recorded!");
                        var search_input = shadowRootPopup.getElementById('search_tag');
                        search_input.value = '';
                        var ke2 = document.createEvent("KeyboardEvent");
                        ke2.initKeyboardEvent("keyup", true, true, window, "U+0008", 0, ""); //back space keypup event
                        search_input.dispatchEvent(ke2);
                        generateTagUI(element, index+1);
                        generateTagUI1(element, index+1);
                        shadowRootPopup.getElementById('no-tags-message').style.display = 'none';
                    });
                });
            })
        }
        
        shadowRootPopup.getElementById('input-tag').onkeyup = function() {
            var list = shadowRootPopup.getElementById('search-results');
            var childs = list.childNodes;
            if (this.value.length > 0) {
                this.nextElementSibling.style = "display: block";
            } else {
                this.nextElementSibling.style = "display: none";
            }
            this.nextElementSibling.onclick = function() {
                this.previousElementSibling.value = '';
                this.style = "display: none";
                childs.forEach(child => {
                    if (child.className == 'tag-div') {
                        child.style = "display: block;";
                    }
                })
            }
            childs.forEach(child => {
                if (child.className == 'tag-div') {
                    var title = child.title.toLowerCase();
                    var value = this.value.toLowerCase();
                    if (!title.includes(value)) {
                        child.style = "display: none;";
                    } else {
                        child.style = "display: block;";
                    }
                }
            });
        }

        shadowRootPopup.getElementById('input-doc').onkeyup = function(e) {
            var list = shadowRootPopup.getElementById('search-results');
            var childs = list.childNodes;
            if (this.value.length > 0) {
                this.nextElementSibling.style = "display: block";
            } else {
                this.nextElementSibling.style = "display: none";
            }
            this.nextElementSibling.onclick = function() {
                this.previousElementSibling.value = '';
                this.style = "display: none";
                //for reset list
                childs.forEach(child => {
                    if (child.className == 'tag-div') {
                        child.style = "display: block;";
                    }
                })
            }
            childs.forEach(child => {
                if (child.className == 'tag-div') {
                    child.style = "display: none;";
                    var value = this.value.toLowerCase();
                    var grandChilds = child.querySelectorAll('.doc-name');
                    var doc_name_array = [];
                    grandChilds.forEach(grandChild => {
                        doc_name_array.push(grandChild.innerHTML.toLowerCase());
                    })
                    if (doc_name_array.indexOf(value) == '-1') {
                        child.style = "display: none;";
                    } else {
                        child.style = "display: block;";
                    }
                }
            });
        }

        shadowRootPopup.getElementById('input-content').onkeyup = function() {
            var value = this.value.toLowerCase();
            var list = shadowRootPopup.getElementById('search-results');
            var childs = list.childNodes;

            childs.forEach(child => {
                if (this.value.length == 0) {
                    child.style = "display: block";
                }
                if (child.className == 'tag-div') {
                    child.style = "display: none;";
                    var grandChilds = child.querySelectorAll('.tagged-text');
                    grandChilds.forEach(grandChild => {
                        if (!grandChild.innerText.toLowerCase().includes(value)) {
                            child.style = "display: none;";
                        } else {
                            child.style = "display: block;";
                        }
                    })
                }
            });
        }

        var key = 0;
        var searchIndex=0;
        var searchResults = []
        var prevkeyword;
        shadowRootPopup.getElementById('next-instance-button').onclick = function() {
            // var keywords = shadowRootPopup.getElementById('keyword-input');
            // keywords = keywords.value.split(',');
            // searchIndex++
            // keywords.forEach(keyword => {
            //     if(highlightSearchNextPart(keyword, '#ffff00', searchIndex) == false){
            //         searchIndex = -1;
            //     }
            // });
            // debugger
            searchIndex++;
            searchClick()
            // window.scrollTo(selects[searchIndex].offsetLeft, selects[searchIndex].offsetTop)
        }

        shadowRootPopup.getElementById('previous-instance-button').onclick = function() {
            searchIndex--
            searchClick()
        }

        shadowRootPopup.getElementById('library-list').onclick = function() {
            shadowRootPopup.getElementById('keyword-input').value = this.value;
        }

        function searchClick() {
            debugger
            search_type = shadowRootPopup.getElementById('matching-type').value
            var keywords = shadowRootPopup.getElementById('keyword-input');
            if(keywords.value != prevkeyword ) {
                document.querySelectorAll('.fluidhighlight').forEach(result => {
                    try {
                        result.removeAttribute('class')
                        result.removeAttribute('style')
                    } catch(e) {

                    }
                })
                searchResults = []
                prevkeyword = keywords.value
                keywords = keywords.value.split(',');
                keywords.forEach(keyword => {
                    highlightSearchString(keyword, '#ffff00')
                });
                searchIndex = 0
                window.scrollTo(0,0)
            }
            var selects = document.querySelectorAll('.fluidhighlight')
            for(i=0;i<selects.length;i++) {
                var format = {
                    start:0,end:0
                }
                var preSelectionRange = new Range()
                preSelectionRange.selectNodeContents(document)
                preSelectionRange.setEnd(document.querySelectorAll('.fluidhighlight')[i],0)
                format.start = preSelectionRange.toString().length
                format.end = preSelectionRange.toString().length + document.querySelectorAll('.fluidhighlight')[i].innerHTML.length
                searchResults.push(format)
            }
            if(searchIndex >= searchResults.length) searchIndex = 1;
            console.log(searchIndex)
            SelectString(searchResults[searchIndex])
        }

        shadowRootPopup.getElementById('content-more-option').onclick = function() {
            
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
                    
                    chrome.runtime.sendMessage({
                        contentScriptQuery: "getUser",
                    }, function(user) {
                        console.log(user);
                        chrome.runtime.sendMessage({
                            contentScriptQuery: "get-status"
                        }, function(result) {
                            var popup_menu = document.createElement('div');
                            popup_menu.className = 'popup-menu';
                            popup_menu.id="popup-menu-id";
                            
                            var remain_across = document.createElement('div');
                            remain_across.className = 'delete-tag dropdown-item';
                            if(result.response[0] == 1) {
                                var icon_span = document.createElement('span');
                                icon_span.className = 'material-icons-outlined popup-icon';
                                icon_span.innerText = 'check';
                                remain_across.appendChild(icon_span);
                            }
                            var name_span = document.createElement('span');
                            name_span.className = 'popup-name';
                            if(result.response[0] == 0) {
                                name_span.style.paddingLeft = '30px';
                            }
                            name_span.innerText = 'Remains open across tabs';
                            remain_across.appendChild(name_span);
                            remain_across.onclick = function() {
                                this.parentElement.remove()
                                chrome.runtime.sendMessage({
                                    contentScriptQuery: "status-remain-across"
                                }, function(result) {
                                })
                            }
                            popup_menu.appendChild(remain_across);

                            var popup_divider = document.createElement('div');
                            popup_divider.className = 'dropdown-divider popup-divider';
                            popup_menu.appendChild(popup_divider);

                            var link_guide = document.createElement('div')
                            link_guide.className = 'dropdown-item'
                            var name_span = document.createElement('span');
                            name_span.className = 'popup-name';
                            name_span.style.paddingLeft = '30px';
                            name_span.innerText = 'Link to user guide';
                            link_guide.appendChild(name_span)
                            link_guide.onclick = function() {
                                this.parentElement.remove()
                                window.open("https://eightarms.bit.ai/docs/view/33zXPjGB7W6AXCGI", '_blank');
                            }
                            popup_menu.appendChild(link_guide)

                            var open_sheet = document.createElement('div')
                            open_sheet.className = 'dropdown-item'
                            var name_span = document.createElement('span');
                            name_span.className = 'popup-name';
                            name_span.style.paddingLeft = '30px';
                            name_span.innerText = 'Open datasheet';
                            open_sheet.appendChild(name_span)
                            open_sheet.onclick = function() {
                                this.parentElement.remove()
                                window.open(shadowRootPopup.getElementById('current-spreadsheet').getAttribute('href'), '_blank');
                            }
                            popup_menu.appendChild(open_sheet)

                            var popup_divider = document.createElement('div');
                            popup_divider.className = 'dropdown-divider popup-divider';
                            popup_menu.appendChild(popup_divider);

                            var userdiv = document.createElement('div')
                            userdiv.className = 'dropdown-item'
                            var user_span = document.createElement('span');
                            user_span.className = 'popup-name';
                            user_span.style.cursor = 'auto'
                            user_span.style.paddingLeft = '0px';

                            var logodiv = document.createElement('div');
                            logodiv.style.width = '30px';
                            logodiv.style.position = 'absolute'
                            logodiv.style.left = '6px'
                            var logoimg = document.createElement('img')
                            logoimg.src = user.picture
                            logoimg.style.width = '30px'
                            logoimg.style.borderRadius = '100%'
                            logodiv.appendChild(logoimg)
                            user_span.appendChild(logodiv)

                            var usermain = document.createElement('div')
                            usermain.style.paddingLeft = '30px'

                            // var hddiv = document.createElement('div')
                            // user.hd == undefined ? hdtext = user.given_name : hdtext = user.hd
                            // hddiv.innerHTML = (`<span style="font-weight: 700;font-size: 15px;">`+hdtext+`</span>`)
                            // usermain.appendChild(hddiv)
                            var namediv = document.createElement('div')
                            namediv.innerHTML = (`<span style="font-size: 15px;">`+user.name+`</span>`)
                            usermain.appendChild(namediv)
                            var emaildiv = document.createElement('div')
                            emaildiv.innerHTML = (`<span style="font-size: 12px;color: grey;">`+user.email+`</span>`)
                            usermain.appendChild(emaildiv)

                            user_span.appendChild(usermain)
                            userdiv.appendChild(user_span)
                            popup_menu.appendChild(userdiv)

                            // var popup_divider = document.createElement('div');
                            // popup_divider.className = 'dropdown-divider popup-divider';
                            // popup_menu.appendChild(popup_divider);

                            // var signout = document.createElement('div')
                            // signout.className = 'dropdown-item'

                            // var signoutspan = document.createElement('span')
                            // signoutspan.className = 'material-icons-outlined popup-icon'
                            // signoutspan.innerText = 'logout'
                            // signout.appendChild(signoutspan)

                            // var signoutspan = document.createElement('span')
                            // signoutspan.className = 'popup-name'
                            // signoutspan.innerText = 'Sign Out'
                            // signout.appendChild(signoutspan)
                            // signout.onclick = function() {
                            //     // chrome.runtime.sendMessage({
                            //     //     contentScriptQuery: "sign-out",
                            //     // }, function(response) {

                            //     // })
                            // }

                            // popup_menu.appendChild(signout);
                            

                            content.parentElement.appendChild(popup_menu);
                        })
                    })
                }
            }
        }

        shadowRootPopup.getElementById('navigator-more-option').onclick = function() {
            var content = shadowRootPopup.getElementById(this.id)
            const elements = shadowRootPopup.querySelectorAll('.popup-menu');
            if (elements != null) {
                if (elements.length > 0) {
                    elements.forEach(element => {
                        // if(element.title != this.title){
                        element.parentNode.removeChild(element);
                        // }
                    })
                } else {
                    chrome.runtime.sendMessage({
                        contentScriptQuery: "get-status"
                    }, function(result) {
                        var popup_menu = document.createElement('div');
                        popup_menu.className = 'popup-menu';
                        popup_menu.id="popup-menu-id";
                        
                        var mural_icons = document.createElement('div');
                        mural_icons.className = 'delete-tag dropdown-item';
                        if(result.response[1] == 1) {
                            var icon_span = document.createElement('span');
                            icon_span.className = 'material-icons-outlined popup-icon';
                            icon_span.innerText = 'check';
                            mural_icons.appendChild(icon_span);
                        }
                        var name_span = document.createElement('span');
                        name_span.className = 'popup-name';
                        if(result.response[1] == 0) {
                            name_span.style.paddingLeft = '30px';
                        }
                        name_span.innerText = 'Display Mural icons';
                        mural_icons.appendChild(name_span);
                        mural_icons.onclick = function() {
                            this.parentElement.remove()
                            chrome.runtime.sendMessage({
                                contentScriptQuery: "status-mural-icon"
                            }, function(result) {
                                debugger
                                var icons = shadowRootPopup.querySelectorAll('.mural-icon')
                                icons.forEach(icon => {
                                    if(result.response[1] == 0){
                                        icon.setAttribute('hidden',true)
                                    } else {
                                        icon.removeAttribute('hidden')
                                    }
                                })
                            })
                        }
                        popup_menu.appendChild(mural_icons);
    
                        var miro_icons = document.createElement('div')
                        miro_icons.className = 'dropdown-item'
                        
                        if(result.response[2] == 1) {
                            var icon_span = document.createElement('span');
                            icon_span.className = 'material-icons-outlined popup-icon';
                            icon_span.innerText = 'check';
                            miro_icons.appendChild(icon_span);
                        }
                        var name_span = document.createElement('span');
                        name_span.className = 'popup-name';
                        if(result.response[2] == 0) {
                            name_span.style.paddingLeft = '30px';
                        }
                        name_span.innerText = 'Display Miro icons';
                        miro_icons.appendChild(name_span)
                        miro_icons.onclick = function() {
                            this.parentElement.remove()
                            chrome.runtime.sendMessage({
                                contentScriptQuery: "status-miro-icon"
                            }, function(result) {
                                var icons = shadowRootPopup.querySelectorAll('.miro-icon')
                                icons.forEach(icon => {
                                    if(result.response[2] == 0){
                                        icon.setAttribute('hidden',true)
                                    } else {
                                        icon.removeAttribute('hidden')
                                    }
                                })
                            })
                        }
                        popup_menu.appendChild(miro_icons)
    
                        var trello_icons = document.createElement('div')
                        trello_icons.className = 'dropdown-item'
                        
                        if(result.response[3] == 1) {
                            var icon_span = document.createElement('span');
                            icon_span.className = 'material-icons-outlined popup-icon';
                            icon_span.innerText = 'check';
                            trello_icons.appendChild(icon_span);
                        }
                        var name_span = document.createElement('span');
                        name_span.className = 'popup-name';
                        if(result.response[3] == 0) {
                            name_span.style.paddingLeft = '30px';
                        }
                        name_span.innerText = 'Display Trello icons';
                        trello_icons.appendChild(name_span)
                        trello_icons.onclick = function() {
                            this.parentElement.remove()
                            chrome.runtime.sendMessage({
                                contentScriptQuery: "status-trello-icon"
                            }, function(result) {
                                var icons = shadowRootPopup.querySelectorAll('.trello-icon')
                                icons.forEach(icon => {
                                    if(result.response[3] == 0){
                                        icon.setAttribute('hidden',true)
                                    } else {
                                        icon.removeAttribute('hidden')
                                    }
                                })
                            })
                        }
                        popup_menu.appendChild(trello_icons)
    
                        // end popup menu
                        content.parentElement.appendChild(popup_menu);
                    })
                }
            }
        }

        const pencils = shadowRootPopup.querySelectorAll('.choose-spreadsheet-icon');
        Array.from(pencils).forEach(element => {
            element.addEventListener('click', () => {
                shadowRootPopup.getElementById('chooseSheetModal').classList.add('show');
                shadowRootPopup.getElementById('modalBackdrop').classList.add('show');
                shadowRootPopup.getElementById('close_chooseSheetModal').onclick = function() {
                    shadowRootPopup.getElementById('chooseSheetModal').classList.remove('show');
                    shadowRootPopup.getElementById('modalBackdrop').classList.remove('show');
                }
                shadowRootPopup.getElementById('dismisModal').onclick = function() {
                    shadowRootPopup.getElementById('chooseSheetModal').classList.remove('show');
                    shadowRootPopup.getElementById('modalBackdrop').classList.remove('show');
                }
            });
        });

        shadowRootPopup.getElementById('spreadsheet-action').onchange = function() {
            let previous_sheet = shadowRootPopup.getElementById('previous-spreadsheet-list');
            let new_sheet = shadowRootPopup.getElementById('create-spreadsheet-div');
            let select_one = shadowRootPopup.getElementById('select-one-div');

            switch (this.value) {
                case 'select-one':
                    return select_one.style.display = 'block', previous_sheet.style.display = 'none', new_sheet.style.display = 'none', !0;
                case 'use-previous':
                    return select_one.style.display = 'none', previous_sheet.style.display = 'block', new_sheet.style.display = 'none', !0;
                case 'create-new':
                    return select_one.style.display = 'none', previous_sheet.style.display = 'none', new_sheet.style.display = 'block', !0;
            }
        }

        shadowRootPopup.getElementById('copyto-mural').onclick = function() {
            selectedTr = shadowRootPopup.querySelectorAll('.row-selected')
            var clip = ``
            for(i=0; i<selectedTr.length; i++) {
                clip += (selectedTr[i].children[0].innerText+"")
                clip += ("Code: #"+selectedTr[i].getAttribute('code')+"")
                clip += ("Author: "+selectedTr[i].getAttribute('arthor')+"")
                clip += ("Source: "+selectedTr[i].getAttribute('source')+"")
                clip += ("Datasheet: "+selectedTr[i].getAttribute('datasheet')+"")
                if(i!=selectedTr.length-1) {
                    clip += '\n'
                }
            }
            if(clip != ``) {
                navigator.clipboard.writeText(clip)
                debugger
            }
        }
        
        shadowRootPopup.getElementById('copyto-miro').onclick = function() {
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
                debugger
            }
            if(clip != ``) {
                navigator.clipboard.writeText(clip)
            }
        }

        shadowRootPopup.getElementById('create-spreadsheet-name').onkeyup = function() {
            shadowRootPopup.getElementById('confirm-button').disabled = this.value.length > 0 ? false : true;
        }

        var selectedPrev = {};

        shadowRootPopup.getElementById('confirm-button').onclick = function() {
            var option = shadowRootPopup.getElementById('spreadsheet-action');
            if (option.value == "create-new") {
                this.innerText = "Creating..."
                let name = shadowRootPopup.getElementById('create-spreadsheet-name');
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
            } else if (option.value == "use-previous") {
                this.innerText = "Selecting...";

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

        }


        chrome.runtime.sendMessage({
            contentScriptQuery: "getDriveFiles",
            title: name.value
        }, function(result) {
            if(result === undefined) return;
            var sid = result.current_sheet_id;
            var list = shadowRootPopup.getElementById('previous-spreadsheet-list');
            var button = shadowRootPopup.getElementById('confirm-button');
            //Default 
            // for (var i=0 ;i<result.files.length ; i++) {
            //     if(result.files[i].id !== result.current_sheet_id) {
            //         var ditem = document.createElement('div');
            //         ditem.className = 'spreadsheet-item';
            //         var dchecks = document.createElement('span');
            //         dchecks.className = 'material-icons check-spreadsheet';
            //         dchecks.id="radio"+i;
            //         dchecks.innerText = (sid == result.files[i].id) ? 'radio_button_checked' : 'radio_button_checked';
            //         ditem.appendChild(dchecks);
            //         var dlink = document.createElement('span');
            //         dlink.className = 'spreadsheet-item-name';
            //         dlink.title = `https://docs.google.com/spreadsheets/d/`+result.files[i].id+`/edit`;
            //         dlink.innerText = result.files[i].name;
            //         ditem.appendChild(dlink);
            //         var dhidden = document.createElement('input');
            //         dhidden.type = 'hidden';
            //         dhidden.className = 'spreadsheet-item-id';
            //         dhidden.value = result.files[i].id;
            //         dhidden.hidden = dlink.title;
            //         ditem.appendChild(dhidden);
            //         list.appendChild(ditem);
            //         ditem.onclick = function(e) {
            //             shadowRootPopup.querySelectorAll('.check-spreadsheet').forEach(element => {
            //                 element.innerText = 'radio_button_unchecked';
            //                 if(element.id === e.target.id) {
            //                     element.innerText = 'radio_button_checked';
            //                     button.disabled = false;
            //                     selectedPrev = {
            //                         id: element.parentElement.children[2].value,
            //                         name: element.parentElement.children[1].innerText
            //                     }
            //                     console.log(selectedPrev);
            //                 }
            //             })
            //         }
            //     }
            // }
            var index = 0;
            result.items.forEach(file => {
                var sitem = document.createElement('div');
                sitem.className = 'spreadsheet-item';
                var checks = document.createElement('span');
                checks.className = 'material-icons check-spreadsheet';
                checks.innerText = (sid == file.id) ? 'radio_button_checked' : 'radio_button_unchecked';
                sitem.appendChild(checks);
                var link = document.createElement('span');
                link.className = 'spreadsheet-item-name';
                link.title = `https://docs.google.com/spreadsheets/d/${file.id}/edit`;
                link.innerText = file.title;
                sitem.appendChild(link);
                var hidden = document.createElement('input');
                hidden.type = 'hidden';
                hidden.className = 'spreadsheet-item-id';
                hidden.value = file.id
                sitem.appendChild(hidden);
                list.appendChild(sitem);
                sitem.onclick = function() {
                    shadowRootPopup.querySelectorAll('.check-spreadsheet').forEach(element => {
                        element.innerText = 'radio_button_unchecked'
                    });
                    checks.innerText = 'radio_button_checked';
                    button.disabled = false;
                    var selected_sheet = {
                        id: hidden.value,
                        name: link.innerText
                    }
                    selectedPrev = selected_sheet;
                    // chrome.storage.local.set({
                    //     'current_sheet': selected_sheet
                    // }, function() {
                    //     console.log('Spreadsheet selected');
                    // })
                }

                var sheet_table = shadowRootPopup.getElementById('sheet-table-content')
                var appendStr = `
                <tr>
                    <td style="width:30px;padding:7px;">
                        <div class="form-check" sid="`+file.id+`">
                            <input class="form-check-input" type="radio" name="sheet_names" id="sheet_radio`+index+`"/>
                        </div>
                    </td>
                    <td style="width:290px;padding-top:7px; padding-bottom:7px;">`+file.title+`</td>
                </tr>`
                $(sheet_table).append(appendStr)
                if(file.title == shadowRootPopup.querySelector('.choose-spreadsheet-message').innerHTML) {
                    shadowRootPopup.getElementById('sheet_radio'+index).checked = true
                }
                index++
            });
        });
    });
}



function random_rgba() {
    var randomColor = hslToHex(Math.random()*360, Math.random()*100, Math.random()*20+40);
    return randomColor;
}

function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

function clear_highlight() {
    chrome.runtime.sendMessage({
        contentScriptQuery: "getTags",
    },
    function(tags) {
        if(tags != null) {
            tags.forEach(tag => {
                removeHighlight(tag[1]);
            });
        }
        init();
    });
    // var highlights = $(".FluidMemory-Highlight-Span-Tag");
    // for(i=0;i<highlights.length;i++) {
    //     highlights[i].outerHTML = highlights[i].innerHTML;
    // }
}

function clickclose() {
    debugger
    controlSidePanel(350)
    var root = document.getElementById('shadow-wrapper-popup-eathu');
    var title = shadowRootPopup.getElementById('titlee59r4s:xz');
    var tab = shadowRootPopup.getElementById('tab-options');
    var sheet = shadowRootPopup.querySelector('.choose-spreadsheet-main');
    var tabs_header = shadowRootPopup.getElementById('tags-tab-header');
    var header_option = shadowRootPopup.getElementById('header-more-options-button');

    var tags = shadowRootPopup.querySelectorAll('.select-tag-button');
    var colors = shadowRootPopup.querySelectorAll('.change-color-input');
    var viss = shadowRootPopup.querySelectorAll('.toggle-visibility-button');
    var pins = shadowRootPopup.querySelectorAll('.pin-tag-button');
    var names = shadowRootPopup.querySelectorAll('.tag-name');
    var options = shadowRootPopup.querySelectorAll('.more-options-button');
    var sidebarclose = shadowRootPopup.getElementById('close_sidebar');
    var kbshortcutbtn = shadowRootPopup.getElementById('collapse-kbshortcut');
    var tag_list = shadowRootPopup.getElementById('tag-list')
    var mbody = shadowRootPopup.getElementById('mbody');
    var mimage = shadowRootPopup.getElementById('m-image');
    var myContent = shadowRootPopup.getElementById('myTabContent')
    var collapseExpand = shadowRootPopup.getElementById('collapse-expand-button')
    var taglistheight = ( window.innerHeight - 180 ) + "px"
    tag_list.style.height = taglistheight
    collapseExpand.setAttribute("type","show")
    chrome.runtime.sendMessage({
        contentScriptQuery: "getKeyShortcut",
    }, function(response) {
        if(response.response.keyShortcut == 1) { 
            var ttt = shadowRootPopup.getElementById('shortcut')
            $(ttt)[0].checked = false;
         } else {
         }
    })
    //   shadowRootPopup.getElementById('shortcut').onclick = function (e) {
    //       debugger
    //       var shortcutitem = shadowRootPopup.getElementById('shortcut')
    //       var checked = $(shortcutitem)[0].checked
    //       if(!checked) {
    //         $('#shadow-wrapper-popup-eathu').slideToggle("slow");
    //         chrome.storage.local.set({
    //             popup: false
    //         }, console.log('popup state set'));
    //         chrome.runtime.sendMessage({contentScriptQuery: "setKeyShortcut"}, function(result) {
    //         })
    //         $(".shortcut-overlay").show()
    //       } else {
    //         chrome.runtime.sendMessage({contentScriptQuery: "unsetKeyShortcut"}, function(result) {
    //         })
    //         $(".shortcut-overlay").hide()
    //       }
    //   }
        // mimage.style.display = "none"
        // tag_list.style.height = '660px'
        // header_option.style.display = 'inline-block';
        tab.style.display = 'flex';
        sheet.style.display = 'block';
        tabs_header.style.display = 'block';
        root.style.width = '300px';
        sidebarclose.style.display = 'block';
        //kbshortcutbtn.style.display = 'block';
        kbshortcutmode = false;
        myContent.style.display = "block"
        tab.style.display = "flex"
        mbody.style.height = '100vh'
        //mimage.style.display = 'block'
        //kbshortcutbtn.innerText = 'maximize'
        tags.forEach(tag => {
            tag.style.width = '10%';
        });
        colors.forEach(color => {
            // color.style.width = '8%';
            if(kbshortcutmode == true) { color.style.display = 'none'; }
            else { color.style.display = 'inline-block'; }
        });
        viss.forEach(vis => {
            // vis.style.width = '8%';
            if(kbshortcutmode == true) { vis.style.display = 'none'; }
            else {  vis.style.display = 'inline-block';  }
        });
        pins.forEach(pin => {
            // pin.style.width = '8%';
            if(kbshortcutmode == true) { pin.style.display = 'none'; }
            else { pin.style.display = 'inline-block'; }
        });
        names.forEach(name => {
            name.style.width = '55%';
            name.innerHTML = name.title
        });
        options.forEach(option => {
            if(kbshortcutmode == true) { option.style.display = 'none'; }
            else { option.style.display = 'inline-block'; }
        })
        
        // color.style.width = '8%';
        // vis.style.width = '8%';
        // pin.style.width = '8%';
        // name.style.width = '55%';
    // $('#shadow-wrapper-popup-eathu').slideToggle("slow");
    // chrome.storage.local.set({
    //     popup: false
    // }, console.log('popup state set'));
}

function focusBtn(type) {
    // shadowRootPopup.getElementById("collapse-kbshortcut").style.color = "white"
    // shadowRootPopup.getElementById("close_sidebar").style.color = "white"
    // shadowRootPopup.getElementById("collapse-expand-button").style.color = "white"
    // shadowRootPopup.getElementById("collapse-kbshortcut").style.pointerEvents = "all"
    // shadowRootPopup.getElementById("close_sidebar").style.pointerEvents = "all"
    // shadowRootPopup.getElementById("collapse-expand-button").style.pointerEvents = "all"
    // shadowRootPopup.getElementById(type).style.color = "grey"
    // shadowRootPopup.getElementById(type).style.pointerEvents = "none"
}
