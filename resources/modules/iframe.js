
const fetchThumb = async (url, parent, container) => {
    const fetcherFactory = require('./fetchFactory.js').fetchFactory;

    const removeElements = () => {
        // Thumbnail
        parent.querySelectorAll('.embedvideo-thumbnail').forEach(thumb => {
            parent.removeChild(thumb);
        });

        // Title
        const overlay = parent.querySelector('.embedvideo-loader');
        overlay.querySelectorAll('.embedvideo-loader__title').forEach(title => {
            overlay.removeChild(title);
        });

        // Duration
        const footer = parent.querySelector('.embedvideo-loader__footer');
        footer.querySelectorAll('.embedvideo-loader__duration').forEach(duration => {
            overlay.removeChild(duration);
        });
    }

    const {
        fetcher,
        urlManipulation
    } = fetcherFactory( container.getAttribute('data-service') );

    if (fetcher === null) {
        return;
    }

    let id = url;

    // Some url manipulation foo which tries to get the id of the requested video
    if (urlManipulation) {
        if (url.substring(0, 1) === '/') {
            url = 'http:' + url;
        }

        try {
            url = (new URL(url.split('?').shift())).pathname;
        } catch (e) {

        }

        id = url.split('/').pop();
        if (id === '') {
            return;
        }

        if (id.substring(-1) === '?') {
            id = id.substring(0, id.length - 1)
        }
    }

    // Do the actual fetch
    await fetcher(id)
        .then(json => {
            if (json.thumbnail === null) {
                return;
            }

            removeElements();

            const
                picture = document.createElement('picture'),
                image = document.createElement('img');

            picture.classList.add('embedvideo-thumbnail');
            image.src = json.thumbnail;
            image.setAttribute('loading', 'lazy');
            image.classList.add('embedvideo-thumbnail__image');
            picture.append(image);
            parent.prepend(picture);

            if (typeof json.title !== 'undefined' && json.title.length > 0) {
                const
                    overlay = parent.querySelector('.embedvideo-loader'),
                    title = document.createElement('div');

                title.classList.add('embedvideo-loader__title');
                title.innerText = json.title;
                overlay.prepend(title);
            }

            if (typeof json.duration === 'number' ) {
                const formatTime = seconds => {
                    const
                        h = Math.floor(seconds / 3600),
                        m = Math.floor((seconds % 3600) / 60),
                        s = Math.round(seconds % 60);

                    return [
                        h,
                        m > 9 ? m : (h ? '0' + m : m || '0'),
                        s > 9 ? s : '0' + s
                    ].filter(Boolean).join(':');
                };

                const
                    footer = parent.querySelector('.embedvideo-loader__footer'),
                    duration = document.createElement('div');

                duration.classList.add('embedvideo-loader__duration');
                duration.innerText = formatTime(json.duration);
                footer.append(duration);
            }
        })
        .catch(error => {
            //
        });
};

const makeIframe = function(ev) {
    const wrapper = ev.querySelector('.embedvideo-wrapper');

    const getIframeConfig = function() {
        let iframeConfig = ev.dataset.iframeconfig;

        iframeConfig = {
            ...mw.config.get('ev-default-config') ?? [],
            ...mw.config.get('ev-' + ev.dataset.service + '-config') ?? [],
            ...JSON.parse(iframeConfig)
        };

        return iframeConfig;
    }

    const makeIframe = function (event) {
        if (ev?.dataset?.service === 'externalvideo' || ev?.dataset?.service === 'local-embed') {
            event.target.removeEventListener('click', makeIframe);
            wrapper.removeChild(consentDiv);
            return;
        }
        const iframe = document.createElement('iframe');

        for (const [key, value] of Object.entries(getIframeConfig())) {
            iframe.setAttribute(key, value);
        }

        event.target.removeEventListener('click', makeIframe);
        wrapper.removeChild(consentDiv);
        wrapper.appendChild(iframe);
    };

    const togglePrivacyClickListener = function (event) {
        event.stopPropagation();

        loader.classList.toggle('hidden');
        privacyNotice.classList.toggle('hidden');
    };

    /** @type HTMLDivElement|null */
    const consentDiv = wrapper.querySelector('.embedvideo-consent');
    let iframeConfig = ev.dataset.iframeconfig;

    if (consentDiv === null || iframeConfig === null) {
        return;
    }

    iframeConfig = getIframeConfig();

    const loader = consentDiv.querySelector('.embedvideo-loader');
    const privacyNotice = consentDiv.querySelector('.embedvideo-privacyNotice');

    if (consentDiv.dataset.showPrivacyNotice === '1') {
        const continueBtn = consentDiv.querySelector('.embedvideo-privacyNotice__continue');
        const dismissBtn = consentDiv.querySelector('.embedvideo-privacyNotice__dismiss');

        consentDiv.addEventListener('click', togglePrivacyClickListener);
        continueBtn.addEventListener('click', makeIframe);
        dismissBtn.addEventListener('click', togglePrivacyClickListener);
    } else {
        consentDiv.addEventListener('click', makeIframe);
    }

    if (!wrapper.parentElement.classList.contains('no-fetch')) {
        fetchThumb(iframeConfig.src, consentDiv, wrapper.parentElement);
    }
}

module.exports = { makeIframe, fetchThumb }