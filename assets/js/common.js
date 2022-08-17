const extension_logo = chrome.runtime.getURL('assets/icons/EATHU-64.png');
const overlay_big_spinner = chrome.runtime.getURL('assets/icons/EATHU-128.png');
const overlay_small_spinner = chrome.runtime.getURL('assets/icons/EATHU-32.png');
const miro_img = chrome.runtime.getURL('assets/icons/miro.png');
const mural_img = chrome.runtime.getURL('assets/icons/mural.png');
const trello_img = chrome.runtime.getURL('assets/icons/trello.png');

function markText(word, color, range) {
    console.log(word);
    
    if(range == '') {
        keywords = word.split(',');
        keywords.forEach(keyword => {
            highlightSearchString1(keyword, color)
        });
    } else {
        if (window.location.href.match(/\.pdf$/) === null) {
            words = word.split('\n');
            //console.log(word);
            words.forEach(word => {
                if (word !== "" || word !== null || word !== undefined) {
                    if (document.body.innerText.indexOf(word) >= 0) {
                        highlightString(color, range);
                        // highlight(word, color);
                        $('.fluid-overlay').hide();
                    }
                }
            });
        } else {
                //highlightSentence(word, color);
                // if(range != null || range != undefined) {
                //     highlightString2(word, color, range);
                // } else {
                //     highlightString1(word, color);
                // }
                showHighlightPDF(range, color);
                $('.fluid-overlay').hide();
        }
    }
}

function highlightString1(text, backgroundColor) {
    // if (window.find && window.getSelection) {
    //     document.designMode = "on";
    //     var sel = window.getSelection();
    //     sel.collapse(document.body, 0);
    //     while (window.find(text)) {
    //         document.execCommand("HiliteColor", false, backgroundColor);
    //         try{
    //             var quote = window.getSelection().baseNode.parentNode;
    //             $(quote).addClass("FluidMemory-Highlight-Span-Tag");
    //             var quote = window.getSelection().focusNode.parentNode;
    //             $(quote).addClass("FluidMemory-Highlight-Span-Tag");
    //         } catch(e) {}
    //         sel.collapseToEnd();
    //     }
    //     document.designMode = "off";
    // }
    var range, sel = window.getSelection();
    if (sel.rangeCount && sel.getRangeAt) {
        range = sel.getRangeAt(0);
    };
    var result;
    document.designMode = "on";
    if (range) {
        sel.removeAllRanges();
        sel.addRange(range);
        var preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(document);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        var start = preSelectionRange.toString().length;
        result = {
            start: start,
            end: start + range.toString().length
        };
        console.log(result);
    };
    if (!document.execCommand("HiliteColor", false, backgroundColor)) {
        document.execCommand("BackColor", false, backgroundColor);
    };
    document.designMode = "off";
}

function highlightString(backgroundColor, savedSel) {
    if(savedSel == '') {
        if (window.find && window.getSelection) {
            document.designMode = "on";
            var sel = window.getSelection();
            sel.collapse(document.body, 0);
            while (window.find(text)) {
                document.execCommand("HiliteColor", false, backgroundColor);
                var quote = window.getSelection().baseNode.parentNode;
                $(quote).addClass("fluidhighlight");
                sel.collapseToEnd();
            }
            document.designMode = "off";
        }
    } else {
        if(savedSel.start == undefined) {
            savedSel = JSON.parse(savedSel)
        }
        var charIndex = 0, range = document.createRange();
        range.setStart(document, 0);
        range.collapse(true);
        var nodeStack = [document], node, foundStart = false, stop = false;
        
        while (!stop && (node = nodeStack.pop())) {
            if (node.nodeType == 3) {
                var nextCharIndex = charIndex + node.length;
                if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                    range.setStart(node, savedSel.start - charIndex);
                    foundStart = true;
                }
                if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                    range.setEnd(node, savedSel.end - charIndex);
                    stop = true;
                }
                charIndex = nextCharIndex;
            } else {
                var i = node.childNodes.length;
                while (i--) {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }

        document.designMode = "on";
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
        if (!document.execCommand("HiliteColor", false, backgroundColor)) {
            document.execCommand("BackColor", false, backgroundColor);
        };
        document.designMode = "off";
    }
}

function SelectString(savedSel) {
    var charIndex = 0, range = document.createRange();
    range.setStart(document, 0);
    range.collapse(true);
    var nodeStack = [document], node, foundStart = false, stop = false;
    
    while (!stop && (node = nodeStack.pop())) {
        if (node.nodeType == 3) {
            var nextCharIndex = charIndex + node.length;
            if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                range.setStart(node, savedSel.start - charIndex);
                foundStart = true;
            }
            if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                range.setEnd(node, savedSel.end - charIndex);
                stop = true;
            }
            charIndex = nextCharIndex;
        } else {
            var i = node.childNodes.length;
            while (i--) {
                nodeStack.push(node.childNodes[i]);
            }
        }
    }

    document.designMode = "on";
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    
    document.designMode = "off";
}

function highlightSentence(text, backgroundColor) {
    // var regex = new RegExp(`/[^.?!]*(?<=[.?\s!])${word}(?=[\s.?!])[^.?!]*[.?!]/`, 'igm');
    if (window.find && window.getSelection) {
        document.designMode = "on";
        var sel = window.getSelection();
        sel.collapse(document.body, 0);
        while (window.find(text)) {
            document.execCommand("HiliteColor", false, backgroundColor);
            sel.collapseToEnd();
        }
        document.designMode = "off";
    }
}

function highlightSearchString(text, backgroundColor) {
    if (window.find && window.getSelection) {
        document.designMode = "on";
        var sel = window.getSelection();
        sel.collapse(document.body, 0);
        var count = 0;
        while(window.find(text)) {
            count++;
        }
        sel.collapse(document.body, 0);
        while (window.find(text)) {
            if(count < 2) break;
            document.execCommand("HiliteColor", false, backgroundColor);
            var quote = window.getSelection().baseNode.parentNode;
            $(quote).addClass("fluidhighlight");
            sel.collapseToEnd();
            count--
        }
        document.designMode = "off";
    }
}

function highlightSearchString1(text, backgroundColor) {
    if (window.find && window.getSelection) {
        document.designMode = "on";
        var sel = window.getSelection();
        sel.collapse(document.body, 0);
        while (window.find(text)) {
            document.execCommand("HiliteColor", false, backgroundColor);
            var quote = window.getSelection().baseNode.parentNode;
            sel.collapseToEnd();
        }
        document.designMode = "off";
    }
}



function highlightSearchSentence(text, backgroundColor) {
    // var regex = new RegExp(`/[^.?!]*(?<=[.?\s!])${word}(?=[\s.?!])[^.?!]*[.?!]/`, 'igm');
    if (window.find && window.getSelection && window.getSelection().baseNode.parentNode.id == "viewer") {
        document.designMode = "on";
        var sel = window.getSelection();
        sel.collapse(document.body, 0);
        while (window.find(text)) {
            document.execCommand("HiliteColor", false, backgroundColor);
            var quote = window.getSelection().baseNode.parentNode;
            $(quote).addClass("fluidhighlight");
            sel.collapseToEnd();
        }
        document.designMode = "off";
    }
}

function getHightlightCoords() {
    var pageIndex = PDFViewerApplication.pdfViewer.currentPageNumber - 1; 
    var page = PDFViewerApplication.pdfViewer.getPageView(pageIndex);
    var pageRect = page.canvas.getClientRects()[0];
    var selectionRects = window.getSelection().getRangeAt(0).getClientRects();
    var viewport = page.viewport;
    var selected = selectionRects.map(function (r) {
      return viewport.convertToPdfPoint(r.left - pageRect.x, r.top - pageRect.y).concat(
         viewport.convertToPdfPoint(r.right - pageRect.x, r.bottom - pageRect.y)); 
    });
    return {page: pageIndex, coords: selected};
}

function showHighlightPDF(selected, color) {
    if(selected.page == undefined) {
        try{
            selected = JSON.parse(selected);
        } catch(e) { return; }
    }
    var pageIndex = selected.page; 
    var page = PDFViewerApplication.pdfViewer.getPageView(pageIndex);
    if(page.canvas != undefined) {
        var pageElement = page.canvas.parentElement;
        var viewport = page.viewport;
        selected.coords.forEach(function (rect) {
            var bounds = viewport.convertToViewportRectangle(rect);
            var el = document.createElement('div');
            el.setAttribute('style', 'position: absolute;opacity:0.5; stop-opacity:inherit; background-color: '+ color +';' + 
                'left:' + Math.min(bounds[0], bounds[2]) + 'px; top:' + Math.min(bounds[1], bounds[3]) + 'px;' +
                'width:' + Math.abs(bounds[0] - bounds[2]) + 'px; height:' + Math.abs(bounds[1] - bounds[3]) + 'px;');
            pageElement.appendChild(el);
        });
    }
}

function nl2br(str, is_xhtml) {
    if (typeof str === 'undefined' || str === null) {
        return '';
    }
    var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
    return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}


function removeHighlight(tag_color) {
    if (window.location.href.match(/\.pdf$/) === null) {
        tag_color = hex2rgb(tag_color);
        $('span').each(function() {
            var bg = $(this).css('background-color');
            if (rgbMatches(bg, tag_color)) {
                this.style.backgroundColor = 'transparent';
            }
        });
    } else {
        tag_color = hex2rgb(tag_color);
        $('div').each(function() {
            var bg = $(this).css('background-color');
            if (rgbMatches(bg, tag_color)) {
                this.style.backgroundColor = 'transparent';
            }
        });
    }
    $('.fluid-overlay').hide();
}


function removeTagHighlight(content, tag_color) {
    tag_color = hex2rgb(tag_color);
    $('span').each(function() {
        var bg = $(this).css('background-color');
        var iHtml = $(this).text();
        if (rgbMatches(bg, tag_color)) {
            if (typeof iHtml == "string" && typeof content == "string" && iHtml === content) {
                this.style.backgroundColor = 'transparent';
                $('.fluid-overlay').hide();
            }
            $('.fluid-overlay').hide();
        }
    });
}

const hex2rgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgb(${r},${g},${b})`;
}

function rgbExtract(s) {
    var match = /^\s*rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\)\s*$/.exec(s);
    if (match === null) {
        return null;
    }
    return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10)
    };
}

function rgbMatches(sText, tText) {
    var sColor = rgbExtract(sText),
        tColor = rgbExtract(tText);
    if (sColor === null || tColor === null) {
        return false;
    }
    var componentNames = ['r', 'g', 'b'];
    for (var i = 0; i < componentNames.length; ++i) {
        var name = componentNames[i];
        if (sColor[name] != tColor[name]) {
            return false;
        }
    }
    return true;
}

function getSelectedText() {
    if (window.getSelection) {
        txt = window.getSelection().toString();

    } else if (window.document.getSelection) {
        txt = window.document.getSelection().toString();
    } else if (window.document.selection) {
        txt = window.document.selection.createRange().text;
    }
    return txt;
}

function getSelectionHtml() {
    var html = "";
    if (typeof window.getSelection != "undefined") {
        var sel = window.getSelection();
        if (sel.rangeCount) {
            var container = document.createElement("div");
            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                container.appendChild(sel.getRangeAt(i).cloneContents());
            }
            html = container.innerHTML;
        }
    } else if (typeof document.selection != "undefined") {
        if (document.selection.type == "Text") {
            html = document.selection.createRange().html;
        }
    }
    return html;
}