// ========== BLOG CONTENT GENERATOR (FINAL) ==========
let blogData = { title:"", content:[], imageCount:0, fileProcessed:false };

function uploadBlogFile(){
    const file=document.getElementById("blogFileInput").files[0];
    if(!file){ utils.showNotification("Please select a file to upload.","warning"); return; }

    const progressInterval=utils.showProgress("blogProgress","blogProgressText","Reading DOCX file...");
    const reader=new FileReader();
    reader.onload=async event=>{
        try{
            document.getElementById("blogProgressText").textContent="Converting DOCX to HTML...";
            const mammothResult=await mammoth.convertToHtml({arrayBuffer:event.target.result});
            const rawHtml=mammothResult.value||"";

            document.getElementById("blogProgressText").textContent="Optimizing HTML structure...";
            const optimizedHtml=enhancedCleanHTML(rawHtml);

            document.getElementById("blogProgressText").textContent="Extracting blog content...";
            extractBlogContent(optimizedHtml,progressInterval);
        }catch(error){
            console.error("Conversion error:",error);
            utils.hideProgress("blogProgress",progressInterval);
            utils.showNotification("Error processing the file. Please try again.","error");
        }
    };
    reader.onerror=()=>{ utils.hideProgress("blogProgress",progressInterval); utils.showNotification("Error reading the file. Please try again.","error"); };
    reader.readAsArrayBuffer(file);
}

/** Enhanced HTML cleanup: remove meta blocks & unwanted lines, clean HTML */
function enhancedCleanHTML(html){
    const tempDiv=document.createElement("div");
    tempDiv.innerHTML=html;
    const metaMarkers=['faq', 'frequently asked questions', 'faqs', 'Meta Description', 'Meta Title', 'meta description','meta title', 'Slug', 'Category', 'category', 'slug','relevant courses'];
    const lineRemoveMarkers=['link:','alt-text','alt text:','title text:'];

    const allElements=Array.from(tempDiv.querySelectorAll('*'));
    let removeFromIndex=-1;
    for(let i=0;i<allElements.length;i++){
        const el=allElements[i];
        const text=(el.textContent||"").trim();
        if(!text) continue;
        const lowerText=text.toLowerCase();

        if(metaMarkers.some(m=>lowerText.startsWith(m))){ removeFromIndex=i; break; }
        if(lineRemoveMarkers.some(m=>lowerText.startsWith(m))){ el.remove(); }
    }

    if(removeFromIndex!==-1){
        for(let j=removeFromIndex;j<allElements.length;j++){
            const nodeToRemove=allElements[j];
            if(nodeToRemove && nodeToRemove.parentNode){ try{ nodeToRemove.parentNode.removeChild(nodeToRemove); }catch(e){} }
        }
    }

    cleanHTML(tempDiv);
    improveListStructure(tempDiv);
    return tempDiv.innerHTML;
}

/** Clean HTML: remove inline styles/classes, unwrap spans/divs, remove empty nodes */
function cleanHTML(element){
    element.querySelectorAll('*[style]').forEach(el=>el.removeAttribute('style'));
    element.querySelectorAll('*[class]').forEach(el=>el.removeAttribute('class'));

    Array.from(element.querySelectorAll('span')).forEach(span=>{
        const parent=span.parentNode;
        while(span.firstChild) parent.insertBefore(span.firstChild,span);
        parent.removeChild(span);
    });

    Array.from(element.querySelectorAll('div')).forEach(div=>{
        const parent=div.parentNode;
        if(!parent) return;
        while(div.firstChild) parent.insertBefore(div.firstChild,div);
        if(div.parentNode) parent.removeChild(div);
    });

    element.innerHTML=element.innerHTML.replace(/(<br\s*\/?>\s*){2,}/gi,'<br/>');

    Array.from(element.querySelectorAll('*')).forEach(el=>{
        if(el.tagName==='IMG') return;
        if(!el.textContent.trim() && el.children.length===0) el.remove();
    });
}

/** Improve lists: remove empty <li>, remove empty <ul>/<ol> */
function improveListStructure(element){
    Array.from(element.querySelectorAll('ul,ol')).forEach(list=>{
        Array.from(list.querySelectorAll('li')).forEach(li=>{
            li.innerHTML=li.innerHTML.replace(/&gt;/g,'');
            if(!li.textContent.trim() && li.children.length===0) li.remove();
        });
        if(!list.children.length) list.remove();
    });
}

/** Extract blog content: title + content array */
function extractBlogContent(html,progressInterval){
    try{
        const tempDiv=document.createElement("div");
        tempDiv.innerHTML=html;

        blogData={title:"",content:[],imageCount:0,fileProcessed:false};
        cleanHTML(tempDiv);
        extractTitle(tempDiv);
        processContentElements(tempDiv);

        blogData.fileProcessed=true;
        utils.hideProgress("blogProgress",progressInterval);

        if(blogData.imageCount>0){ document.getElementById("imageInputsContainer").style.display="block"; createImageInputs(); utils.showNotification(`Blog content extracted successfully! Found ${blogData.imageCount} image placeholders.`,"success"); }
        else{ document.getElementById("imageInputsContainer").style.display="none"; utils.showNotification("Blog content extracted successfully! No images detected.","success"); }
    }catch(error){
        console.error("Extraction error:",error);
        utils.hideProgress("blogProgress",progressInterval);
        utils.showNotification("Error extracting content. Please check the file format.","error");
    }
}

/** Prefer H1 as title or fallback */
function extractTitle(element){
    const h1=element.querySelector('h1');
    if(h1 && h1.textContent.trim()){ blogData.title=h1.textContent.trim(); h1.remove(); return; }

    for(const p of Array.from(element.querySelectorAll('p'))){
        const text=(p.textContent||"").trim();
        if(text && text.length>10 && text.length<200){ blogData.title=text; p.remove(); return; }
    }

    for(const el of Array.from(element.querySelectorAll('*'))){
        const text=(el.textContent||"").trim();
        if(text && text.length>5){ blogData.title=text.split('.')[0]; return; }
    }
}

/** Process content nodes in order */
function processContentElements(rootElement){
    const walker=document.createTreeWalker(rootElement,NodeFilter.SHOW_ELEMENT,null,false);
    const metaMarkers=['meta description','meta title','slug','relevant courses'];
    let node;
    while(node=walker.nextNode()){
        if(!node || !node.textContent) continue;
        const text=(node.textContent||"").trim();
        if(!text) continue;
        const lowerText=text.toLowerCase();
        if(metaMarkers.some(m=>lowerText.startsWith(m))) break;

        const tag=node.tagName.toLowerCase();
        if(tag.match(/^h[1-6]$/)){
            const level=parseInt(tag.charAt(1));
            blogData.content.push({type:'heading',level:level,className:`fs-${level}`,content:node.innerHTML.trim()});
        }else if(tag==='p'){
            const html=node.innerHTML.trim();
            if(html && html.replace(/<[^>]*>/g,'').trim().length>0) blogData.content.push({type:'paragraph',content:html});
        }else if(tag==='ul'||tag==='ol'){
            const items=Array.from(node.querySelectorAll('li')).map(li=>li.innerHTML.trim()).filter(i=>i.length>0);
            if(items.length) blogData.content.push({type:'list',ordered:tag==='ol',items:items});
        }else if(tag==='img'){
            blogData.imageCount++;
            blogData.content.push({type:'image',alt:node.getAttribute('alt')||`Blog image ${blogData.imageCount}`,placeholder:`[Image ${blogData.imageCount}]`});
        }
    }
}

/** Create image input fields */
function createImageInputs(){
    const container=document.getElementById("imageInputs"); if(!container) return; container.innerHTML="";
    for(let i=1;i<=blogData.imageCount;i++){
        const inputGroup=document.createElement("div"); inputGroup.className="mb-3";
        inputGroup.innerHTML=`<label class="form-label">Image ${i} URL:</label>
            <input type="text" class="form-control image-url-input" id="imageUrl${i}" placeholder="https://example.com/image${i}.jpg" data-index="${i}">`;
        container.appendChild(inputGroup);
    }
}

/** Add image manually */
function addImageInput(){
    blogData.imageCount++;
    const container=document.getElementById("imageInputs"); if(!container) return;
    const inputGroup=document.createElement("div"); inputGroup.className="mb-3";
    inputGroup.innerHTML=`<label class="form-label">Image ${blogData.imageCount} URL:</label>
        <input type="text" class="form-control image-url-input" id="imageUrl${blogData.imageCount}" placeholder="https://example.com/image${blogData.imageCount}.jpg" data-index="${blogData.imageCount}">`;
    container.appendChild(inputGroup);
}

/** Generate final blog HTML */
function generateBlogCode(){
    if(!blogData.fileProcessed){ utils.showNotification("Please upload and process a DOCX file first.","warning"); return; }

    const featuredImageUrl=(document.getElementById("featuredImageUrl")||{value:""}).value.trim();
    const featuredImageAlt=(document.getElementById("featuredImageAlt")||{value:""}).value.trim();
    const featuredImageTitle=(document.getElementById("featuredImageTitle")||{value:""}).value.trim();

    const imageUrls=[]; document.querySelectorAll('.image-url-input').forEach(input=>{ if(input && input.value && input.value.trim()){ const index=parseInt(input.getAttribute('data-index'))-1; imageUrls[index]=input.value.trim(); } });

    let imageIndex=0, blogHTML="";
    if(blogData.title) blogHTML+=`<h1 class="text-center fs-1">${escapeHtml(blogData.title)}</h1><hr>\n\n`;
    if(featuredImageUrl){ let imgTag=`<img src="${escapeAttr(featuredImageUrl)}"`; if(featuredImageAlt) imgTag+=` alt="${escapeAttr(featuredImageAlt)}"`; if(featuredImageTitle) imgTag+=` title="${escapeAttr(featuredImageTitle)}"`; imgTag+=` class="w-100 mb-3">\n\n`; blogHTML+=imgTag; }

    for(const item of blogData.content){
        switch(item.type){
            case 'heading': { const level=item.level||2; const className=item.className?` ${item.className}`:''; blogHTML+=level===1?`<h1 class="text-center${className}">${item.content}</h1>\n\n`:`<h${level} class="${item.className}">${item.content}</h${level}>\n\n`; break; }
            case 'paragraph': { const content=(item.content||"").trim(); if(content && content.replace(/<[^>]*>/g,'').trim().length>0) blogHTML+=`<p>${content}</p>\n\n`; break; }
            case 'list': { const tag=item.ordered?'ol':'ul'; blogHTML+=`<${tag}>\n`; item.items.forEach(li=>{ if(li && li.trim().length>0) blogHTML+=`  <li>${li}</li>\n`; }); blogHTML+=`</${tag}>\n\n`; break; }
            case 'image': { const imageUrl=imageUrls[imageIndex]||"#"; blogHTML+=`<img src="${escapeAttr(imageUrl)}" alt="${escapeAttr(item.alt)}" class="w-100 mb-3">\n\n`; imageIndex++; break; }
        }
    }

    blogHTML+=`<div class="fancy-line"></div><style>.fancy-line{width:60%;margin:20px auto;border-top:2px solid #116466;text-align:center;position:relative}.fancy-line::after{content:"✦ ✦ ✦";position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:white;padding:0 10px;color:red}</style>`;

    const blogCodeEl=document.getElementById("blogCode"); if(blogCodeEl) blogCodeEl.value=blogHTML;
    showGeneratedCode('blog','blogCodeSection');
    utils.showNotification("Blog code generated successfully!","success");
}

/** Helpers */
function escapeHtml(str){ if(str===null||str===undefined) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escapeAttr(str){ if(str===null||str===undefined) return ''; return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function showGeneratedCode(type,sectionId){
    const emptyState = document.getElementById(`${type}EmptyState`);
    if (emptyState) emptyState.classList.add('d-none');
    const section = document.getElementById(sectionId);
    if (section) section.style.display = 'block';
}
