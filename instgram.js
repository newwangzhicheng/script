// ==UserScript==
// @name         Instagram: 图片，视频批量下载器
// @name:en      Instagram: pictures, video batch downloader
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Instagram下载器，支持图片和视频批量下载
// @description:en  Downloader for Instagram, support batch download pictures and videos
// @author       jaywang
// @match        https://www.instagram.com/*
// @require      https://cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.7.1/jszip.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        unsafeWindow
// @run-at       document-idle
// @license MIT
// ==/UserScript==

(function () {
    'use strict';

    const BTN_TAG = 'js-btn';
    const CUR_SVG = `
        <svg style="margin-top: 5px" t="1663695131319" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3070" width="32" height="32"><path d="M249.898667 85.333333h336.213333a64 64 0 0 1 41.301333 15.146667l203.264 171.904A64 64 0 0 1 853.333333 321.237333v535.637334c0 76.373333-0.853333 81.792-79.232 81.792H249.898667C171.52 938.666667 170.666667 933.290667 170.666667 856.874667V167.125333C170.666667 90.752 171.52 85.333333 249.898667 85.333333z" fill="#1296db" opacity=".3" p-id="3071"></path><path d="M635.221333 504.746667H551.68V419.157333a21.333333 21.333333 0 0 0-21.333333-21.333333h-43.648a21.333333 21.333333 0 0 0-21.333334 21.333333v85.674667H381.866667a21.333333 21.333333 0 0 0-16.256 35.114667l126.634666 149.546666a21.333333 21.333333 0 0 0 32.554667 0l126.634667-149.546666a21.333333 21.333333 0 0 0-16.256-35.114667z" fill="#1296db" p-id="3072"></path></svg>
    `;
    const COL_SVG = `
        <svg style="margin-top: 5px" t="1663695241690" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3745" width="32" height="32"><path d="M149.333333 896h725.333334a64 64 0 0 0 64-64v-469.333333A64 64 0 0 0 874.666667 298.666667H426.666667L317.44 189.44A64 64 0 0 0 272.128 170.666667H149.333333A64 64 0 0 0 85.333333 234.666667v597.333333A64 64 0 0 0 149.333333 896z" fill="#1296db" opacity=".3" p-id="3746"></path><path d="M635.221333 547.413333H551.68v-85.632a21.333333 21.333333 0 0 0-21.333333-21.333333h-43.648a21.333333 21.333333 0 0 0-21.333334 21.333333v85.674667H381.866667a21.333333 21.333333 0 0 0-16.256 35.114667l126.634666 149.546666a21.333333 21.333333 0 0 0 32.554667 0l126.634667-149.546666a21.333333 21.333333 0 0 0-16.256-35.114667z" fill="#1296db" p-id="3747"></path></svg>
    `;

    const intervalTimer = setInterval(() => {
        // 帖子
        const posts = document.querySelectorAll('article[role="presentation"]');
        for (let i = 0; i < posts.length; i++) {
            const post = posts[i];
            // 判断是否已经添加下载按钮
            if (!hasDownloadBtn(post)) {
                // 添加下载当前资源按钮
                addDownloadCurrentBtn(post);
                // 判断帖子是否包含多个元素,  添加下载合集按钮
                if (hasMultipleAttachments(post)) {
                    addDownloadCollectionBtn(post);
                }
            }
        }

    }, 500)

    // 判断是否已经有下载按钮
    function hasDownloadBtn(el) {
        return el.querySelector(`[${BTN_TAG}]`) != null;
    }

    // 添加下载当前资源按钮
    function addDownloadCurrentBtn(el) {
        const container = el.querySelector('section');

        const btn = getSvgBtn(CUR_SVG);

        addBtn(btn, container, downloadCurrent);
    }

    // 添加下载合集按钮
    function addDownloadCollectionBtn(el) {
        const container = el.querySelector('section');
        const btn = getSvgBtn(COL_SVG);

        addBtn(btn, container, downloadCollection);
    }

    // 判断是否含多个资源
    function hasMultipleAttachments(el) {
        const attachments = el.querySelectorAll('li[style^="transform"]');
        console.log(attachments)
        return attachments.length > 0;
    }

    // 将svg字符串转化成元素
    function getSvgBtn(svg){
        const span = document.createElement('span');
        span.setAttribute(BTN_TAG, '');
        span.innerHTML = svg;
        return span;
    }

    // 将按钮添加到页面中
    function addBtn(btn, container, handler) {
        container.append(btn);
        $(btn).click(handler);
    }

    function downloadCurrent() {
        console.log('download current');
    }

    function downloadCollection() {
        console.log('download collection');
    }














    // 判断点击的是否是三个小点的更多按钮
    function isMoreOptionsEl(target){
        if(target && (target.getAttribute('aria-label') == '更多选项' || target.querySelector('[aria-label="更多选项"]'))){
            return true;
        }
        return false;
    }

    // 根据子元素获取当前post元素（article）
    function getPostEl(childEl) {
        return childEl.closest('article');
    }
    // 根据post元素（artile）判断当前post是否有多个元素
    function isMultiPost(postEl) {
        // 返回按钮
        const hasReturnBtn = postEl.querySelector('[aria-label="返回"]') != null;
        // 下一步按钮
        const hasNextBtn = postEl.querySelector('[aria-label="下一步"]') != null;;
        return hasReturnBtn || hasNextBtn;
    }
    // Your code here...
    /** 更多选项的选择器 */
    const moreDialogSelector = '[role="dialog"]';
    /** 当前post下(article标签)的用户名称选择器, 获取用户的名称使用textContent */
    const usernameASelector = 'header>div:nth-child(2)>div:first-child';
    /** 复制图片按钮选择器 */
    const copyURLSelector = `${moreDialogSelector} > button:nth-last-child(3)`;
    /** 打开帖子按钮选择器 */
    const openPostSelector = `${moreDialogSelector} > button:nth-last-child(2)`;
    /** 单个下载按钮 */
    const singleDownloadBtn = '<button jaywangdownload="single" class="aOOlW" tabindex="0" style="color: #58c322">下载</button>';
    /** 批量下载图片按钮 */
    const batchDownloadBtn = '<button jaywangdownload="batch" class="aOOlW" tabindex="0" style="color: #58c322">下载合集</button>';
    /**
     * 当前post的下标
     * -1: 代表单图
     */
    let currentIndex = -1;
    /**
     * 当前post
     */
    let currentPost;
    /**
     * 下载图片按钮事件
     * 点击三个小点更多按钮
     */
    $('body').click(async (el) => {
        /** 下载按钮事件 */
        if (el.target.getAttribute('jaywangdownload') === 'single') {
            const index = currentIndex;
            const post = currentPost;
            const username = post.querySelector(usernameASelector).text;

            const isPrivate = isPrivateUser();
            let initSrc;
            let src;
            if (isPrivate) {
                const container = post.querySelector('._97aPb');
                src = getPrivateSrc(container, index);
            } else {
                $(copyURLSelector).click();
                initSrc = await navigator.clipboard.readText();
                src = await getResource(initSrc, index);
            }
            save(src, getName(username, index));
        }

        /** 下载合集按钮事件 */
        if (el.target.getAttribute('jaywangdownload') === 'batch') {
            let initSrc;
            if (isPrivateUser() && withoutOpenPostBtn()) {
                //console.log(`location`, location)
            } else {
                $(`${moreDialogSelector} > button:nth-last-child(${getOpenPostLastLocation()})`).click();
            }
            initSrc = location.href;
            const data = await fetchPostInformation(initSrc);
            const batchInfo = getBatchInformation(data);
            batchSaveAs(batchInfo);
        }

        /** 点击三个小点更多按钮 */
        if (isMoreOptionsEl(el.target)) {
            /** 获取当前post */
            currentPost = getPostEl(el.target);
            /** 根据返回 下一个按钮是否是多图的post */
            const isMulti = isMultiPost(currentPost);
            // TODO
            // currentIndex = isMulti ? getPostIndex(dots) : 0;
            console.log('Post has multiple photos or images: ', isMulti)
        }
    });

    /** DOM变动的回调函数 */
    const callback = function (mutationRecord) {
        console.log()
        for (const record of mutationRecord) {
            const nodeList = record.addedNodes;
            console.log(nodeList)
            if (false && nodeList.length === 1 && isMoreOptionsEl(nodeList[0])) {
                $(moreDialogSelector).prepend(singleDownloadBtn);
                $(moreDialogSelector).prepend(batchDownloadBtn);
                return;
            }
        }
    };
    /** 检测DOM变动 */
    const observer = new MutationObserver(callback);
   // observer.observe(document.body, {
   //     childList: true,
  //      subtree: false
  //  });

    /**
     * 判断是否是更多选项按钮
     * @param {Node} node
     * @return {boolean}
     */
    //function isMoreOptionButton(node) {
      //  return node.querySelector('.mt3GC');
    //}

    /**
     * 获取Post信息
     * @param uri
     * @returns {Promise<any>}
     */
    async function fetchPostInformation(uri) {
        let formatedUri = uri;
        if (uri.includes('?utm_source')) {
            formatedUri = uri.match(/.*(?=\?utm_source)/);
        }
        formatedUri += '?__a=1';
        const result = await fetch(formatedUri);
        const data = await result.json();
        return data;
    }

    /**
     * 获取资源链接
     * @param {string} uri
     * @param {number} index
     */
    async function getResource(uri, index) {
        const data = await fetchPostInformation(uri);
        const isSingle = data.graphql.shortcode_media.edge_sidecar_to_children === undefined;
        const node = isSingle
            ? data.graphql.shortcode_media
            : data.graphql.shortcode_media.edge_sidecar_to_children.edges[index].node;

        const isVideo = node.is_video;
        const src = isVideo
            ? node.video_url
            : node.display_resources[node.display_resources.length - 1].src;
        return src;

    }

    /**
     * 获取第i个信息
     * @param data
     * @param index
     * @returns {*|string}
     */
    function getBatchInformation(data) {
        const isSingle = data.graphql.shortcode_media.edge_sidecar_to_children === undefined;
        let edges;
        if (isSingle) {
            edges = [
                {
                    node: data.graphql.shortcode_media
                }
            ];
        } else {
            edges = data.graphql.shortcode_media.edge_sidecar_to_children.edges;
        }
        const username = data.graphql.shortcode_media.owner.username;
        const infoList = [];
        for (const i in edges) {
            const node = edges[i].node;
            const isVideo = node.is_video;
            const src = isVideo
                ? node.video_url
                : node.display_resources[node.display_resources.length - 1].src;
            infoList.push({
                name: getName(username, i),
                src,
                suffix: isVideo ? 'mp4' : 'jpg'
            });
        }
        return infoList;
    }

    /**
     * 在浏览器里面打开
     * @param {string} src
     */
    function openInBrowser(src) {
        const a = document.createElement('a');
        a.target = '_blank';
        a.href = src;
        document.body.append(a);
        a.click();
        a.remove();
    }

    /**
     * 另存为图片或视频
     * @param {string} src 下载源
     * @param {string} name 图片名称
     */
    async function save(src, name) {
        const data = await fetch(src);
        const blob = await data.blob();
        downloadBlob(blob, name);
    }

    /**
     * 下载blob
     * @param {blob} blob
     */
    function downloadBlob(blob) {
        const domString = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = domString;
        a.setAttribute('download', name);
        a.click();
    }

    /**
     * 批量下载
     */
    async function batchSaveAs(fileList) {
        let promiseList = [];
        let filenameList = [];
        let filename;
        for (const { src, name, suffix } of fileList) {
            filename = name;
            const promise = fetch(src);
            promiseList.push(promise);
            filenameList.push(`${name}.${suffix}`);
        }
        const resultList = await Promise.all(promiseList);
        const blobList = resultList.map((result) => result.blob());
        const zip = new JSZip();
        const folder = zip.folder(filename);
        for(let i = 0; i < filenameList.length; i++) {
            folder.file(filenameList[i], blobList[i]);
        }
        const content = await folder.generateAsync({type:"blob"});
        saveAs(content, `${filename}.zip`);
    }

    /**
     * 定位当前图片下标
     * 多个元素_97aPb内有一个rQDP3，内有_3eoV-
     * 单个元素_97aPb内没有rQDP3
     * @param {Element} node
     */
    function getPostIndex(node) {
        const nodeList = node.childNodes;
        for (let i = 0; i < nodeList.length; i++) {
            const classList = nodeList[i].classList;
            if (classList && classList.contains('XCodT')) {
                return i;
            }
        }
        return 0;
    }

    /**
     * 格式化的日期
     * @returns {string}
     */
    function getFormatedDate() {
        const d = new Date();
        return '' + d.getHours() + d.getMinutes() + d.getSeconds();
    }

    /**
     * 判断是否是私人用户
     * @returns {boolean}
     */
    function isPrivateUser() {
        const nodeList = document.querySelector(moreDialogSelector).querySelectorAll('.HoLwm');
        return nodeList.length <= 3;
    }

    /**
     * 判断是否有打开帖子按钮
     * @returns {boolean}
     */
    function withoutOpenPostBtn() {
        const nodeList = document.querySelector(moreDialogSelector).querySelectorAll('.HoLwm');
        return nodeList.length === 1;
    }

    /**
     * 获取打开帖子按钮倒数的位置
     * @returns {number}
     */
    function getOpenPostLastLocation() {
        const nodeList = document.querySelector(moreDialogSelector).querySelectorAll('.HoLwm');
        return nodeList.length;
    }


    /**
     * 获取图片，视频资源链接
     * @param {Element} container
     * @param {number} index
     * @returns {string}
     */
    function getPrivateSrc(container, index) {
        let resourceContainer = container;
        if (isMultiplePost(container)) {
            /**
             * 图片在post开始是第一个有效的li
             * post结尾是第二个li
             * post中间是中间一个li（中间）
             */
            const hasPrevBtn = container.querySelectorAll('.POSa_').length !== 0;
            const hasNextBtn = container.querySelectorAll('._6CZji').length !== 0;

            let nth = 3;
            if (hasNextBtn && !hasPrevBtn) {
                nth = 2;
            }
            resourceContainer = container.querySelector(`ul.vi798 li:nth-child(${nth})`);
        }
        const video = resourceContainer.querySelector('video');
        const img = resourceContainer.querySelector('img');
        if (video) {
            return video.src;
        }
        if (img) {
            const sets = img.srcset.split(',');
            const lastSet = sets[0];
            return lastSet.split(' ')[0];
        }
    }

    /**
     * 根据名称获取下标
     * @param {string} username
     * @param {number} index
     * @returns {string}
     */
    function getName(username, index) {
        return `${username.split('.').join('')}_${index + 1}_${getFormatedDate()}`;
    }
})();
