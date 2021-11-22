// ==UserScript==
// @name         下载instagram图片
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  Download instgram picture, only support picture
// @description  Click three circle button to show '下载图片' button
// @description  2.0 Support post with multiple pictures 支持多图的帖子
// @author       jaywang
// @match        https://www.instagram.com/*
// @require      https://cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/axios/0.24.0/axios.min.js
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        unsafeWindow
// @run-at       document-idle
// @license MIT
// ==/UserScript==

(function () {
    'use strict';

    // Your code here...
    /** 更多选项列表的选择器 */
    const selectionListSelector = 'div.RnEpo.Yx5HN > div > div > div > div';
    /** 复制图片按钮选择器 */
    const copyURLSelector = `${selectionListSelector} > button:nth-last-child(3)`;
    /** 下载图片按钮 */
    const downloadPictureBtn = '<button downloadpicture="true" class="aOOlW   HoLwm " tabindex="0" style="color: #58c322">下载图片</button>';
    /**
     * 当前post的下标
     * -2：没空
     * -1：单图post
     * 0～N：多图post
     */
    let currentIndex = -2;
    /** 
     * 下载图片按钮事件
     * 点击三个小点更多按钮
     */
    $('body').click(async (el) => {
        /** 下载图片按钮事件 */
        if (el.target.getAttribute('downloadpicture') === 'true') {
            const index = currentIndex;
            currentIndex = -2;
            $(copyURLSelector).click();
            const copiedText = await navigator.clipboard.readText();
            downloadPicture(copiedText, index);
        }

        /** 点击三个小点更多按钮 */
        if (el.target.closest('button.wpO6b')) {
            /** 获取当前post */
            const currentPost = el.target.closest('article');
            /** 容纳点点点的容器 */
            const container = currentPost.querySelector('._97aPb');
            const dots = currentPost.querySelector('._3eoV-');
            currentIndex = isMultiplePost(container) ? getPostIndex(dots) : -1;
        }
    });
    /**  */

    /** DOM变动的回调函数 */
    const callback = function (mutationRecord) {
        for (const record of mutationRecord) {
            const nodeList = record.addedNodes;
            if (nodeList.length === 1 && isMoreOptionButton(nodeList[0])) {
                $(selectionListSelector).prepend(downloadPictureBtn);
            }
        }
    };
    /** 检测DOM变动 */
    const observer = new MutationObserver(callback);
    observer.observe(document.body, {
        childList: true,
        subtree: false
    });

    /**
     * 判断是否是更多选项按钮
     * @param {Node} node
     * @return {boolean}
     */
    function isMoreOptionButton(node) {
        const classList = node.classList;
        if (classList) {
            return classList.contains('RnEpo') && classList.contains('Yx5HN');
        }
        return false;
    }

    /**
     * 根据链接下载图片
     * @param {string} uri
     * @param {number} index
     */
    async function downloadPicture(uri, index) {
        let formatedUri = uri;
        if (uri.includes('?utm_source')) {
            formatedUri = uri.match(/.*(?=\?utm_source)/);
        }
        formatedUri += '?__a=1';
        try {
            const data = await axios.get(formatedUri);
            let src = '';
            if (index === -2) {
                return;
            }
            if (index === -1) {
                src = data.data.graphql.shortcode_media.display_resources[2].src;
            }
            if (index >= 0) {
                const edge = data.data.graphql.shortcode_media.edge_sidecar_to_children.edges[index];
                src = edge.node.display_resources[2].src;
            }
            // window.open(src, '_blank');
            download(src);
            console.log('picture src :>> ', src);
        } catch (error) {
            console.log('download error :>> ', error);
        }

    }

    /**
     * 下载源
     * @param {string} src
     */
    function download(src) {
        const a = document.createElement('a');
        a.target = '_blank';
        a.href = src;
        document.body.append(a);
        a.click();
        a.remove();
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
     * 判断post图片/视频数量是多个还是单个
     * @param {Element} el
     * @return {boolean}
     */
    function isMultiplePost(el) {
        return el.querySelector('._3eoV-') !== null;
    }
})();