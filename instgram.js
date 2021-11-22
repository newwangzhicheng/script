// ==UserScript==
// @name         下载instagram图片
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Download instgram picture, only support picture
// @description  Click three circle button to show '下载图片' button
// @description  2.0 Support post with multiple pictures 支持多图的帖子
// @description  3.0 Support directly download pictures and videos 支持直接下载图片和视频
// @author       jaywang
// @match        https://www.instagram.com/*
// @require      https://cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js
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
    /** 当前post下的用户名称选择器 */
    const usernameASelector = 'header.Ppjfr  a.ZIAjV';
    /** 复制图片按钮选择器 */
    const copyURLSelector = `${selectionListSelector} > button:nth-last-child(3)`;
    /** 下载图片按钮 */
    const jaywangdownloadBtn = '<button jaywangdownload="jaywang" class="aOOlW" tabindex="0" style="color: #58c322">下载</button>';
    /**
     * 当前post的下标
     * -1: 代表不合法下标
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
        /** 下载图片按钮事件 */
        if (el.target.getAttribute('jaywangdownload') === 'jaywang') {
            const index = currentIndex;
            const post = currentPost;
            currentIndex = -1;
            currentPost = null;

            const username = post.querySelector(usernameASelector).text;

            const isPrivate = isPrivateUser();
            let initSrc;
            let src;
            if (isPrivate) {
                src = getPrivateSrc(post.querySelector('._97aPb'));
            } else {
                $(copyURLSelector).click();
                initSrc = await navigator.clipboard.readText();
                src = await getResource(initSrc, index);
            }
            saveAs(src, getName(username, index));
        }

        /** 点击三个小点更多按钮 */
        if (el.target.closest('button.wpO6b')) {
            /** 获取当前post */
            currentPost = el.target.closest('article');
            /** 容纳点点点的容器 */
            const container = currentPost.querySelector('._97aPb');
            const dots = currentPost.querySelector('._3eoV-');
            currentIndex = isMultiplePost(container) ? getPostIndex(dots) : 0;
        }
    });
    /**  */

    /** DOM变动的回调函数 */
    const callback = function (mutationRecord) {
        for (const record of mutationRecord) {
            const nodeList = record.addedNodes;
            if (nodeList.length === 1 && isMoreOptionButton(nodeList[0])) {
                $(selectionListSelector).prepend(jaywangdownloadBtn);
                return;
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
     * 获取资源链接和名称
     * @param {string} uri
     * @param {number} index
     */
    async function getResource(uri, index) {
        let formatedUri = uri;
        if (uri.includes('?utm_source')) {
            formatedUri = uri.match(/.*(?=\?utm_source)/);
            formatedUri += '?__a=1';
        }
        const result = await fetch(formatedUri);
        const data = await result.json();
        const username = data.graphql.shortcode_media.owner.username;
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
    async function saveAs(src, name) {
        const data = await fetch(src);
        const blob = await data.blob();
        const domString = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = domString;
        a.setAttribute('download', name);
        a.click();
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
        const nodeList = document.querySelector(selectionListSelector).querySelectorAll('.HoLwm');
        return nodeList.length <= 2;
    }

    /**
     * 获取图片，视频资源链接
     * @param container
     * @returns {string}
     */
    function getPrivateSrc(container) {
        const img = container.querySelectorAll('img');
        const video = container.querySelectorAll('video');
        if (img) {
            const sets = img.srcset.split(',');
            const lastSet = sets[0];
            return lastSet.split(' ')[0];
        }
        if (video) {
            return video.src;
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