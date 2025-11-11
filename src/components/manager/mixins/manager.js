import Viewer from 'viewerjs';
import 'viewerjs/dist/viewer.css';
// Event bus
import EventBus from '../../../emitter';

export default {
    computed: {
        /**
         * Selected disk for this manager
         * @returns {*}
         */
        selectedDisk() {
            return this.$store.state.fm[this.manager].selectedDisk;
        },

        /**
         * Selected directory for this manager
         * @returns {any}
         */
        selectedDirectory() {
            return this.$store.state.fm[this.manager].selectedDirectory;
        },

        /**
         * Files list for selected directory
         * @returns {*}
         */
        files() {
            return this.$store.getters[`fm/${this.manager}/files`];
        },

        /**
         * Directories list for selected directory
         * @returns {*}
         */
        directories() {
            return this.$store.getters[`fm/${this.manager}/directories`];
        },

        /**
         * Selected files and folders
         * @returns {*}
         */
        selected() {
            return this.$store.state.fm[this.manager].selected;
        },

        /**
         * ACL On/Off
         */
        acl() {
            return this.$store.state.fm.settings.acl;
        },

        /**
         * Check if current path is at root level
         * @return {boolean}
         */
        isRootPath() {
            return this.$store.state.fm[this.manager].selectedDirectory === null;
        },
    },
    methods: {
        /**
         * Load selected directory and show files
         * @param path
         */
        selectDirectory(path) {
            this.$store.dispatch(`fm/${this.manager}/selectDirectory`, { path, history: true });
        },

        /**
         * Level up directory
         */
        levelUp() {
            // if this a not root directory
            if (this.selectedDirectory) {
                // calculate up directory path
                const pathUp = this.selectedDirectory.split('/').slice(0, -1).join('/');

                // load directory
                this.$store.dispatch(`fm/${this.manager}/selectDirectory`, { path: pathUp || null, history: true });
            }
        },

        /**
         * Check item - selected
         * @param type
         * @param path
         */
        checkSelect(type, path) {
            return this.selected[type].includes(path);
        },

        /**
         * Select items in list (files + folders)
         * @param type
         * @param path
         * @param event
         */
        selectItem(type, path, event) {
            // search in selected array
            const alreadySelected = this.selected[type].includes(path);

            // if pressed Ctrl -> multi select
            if (event.ctrlKey || event.metaKey) {
                if (!alreadySelected) {
                    // add new selected item
                    this.$store.commit(`fm/${this.manager}/setSelected`, { type, path });
                } else {
                    // remove selected item
                    this.$store.commit(`fm/${this.manager}/removeSelected`, { type, path });
                }
            }

            // single select
            if (!event.ctrlKey && !alreadySelected && !event.metaKey) {
                this.$store.commit(`fm/${this.manager}/changeSelected`, { type, path });
            }
        },

        /**
         * Show context menu
         * @param item
         * @param event
         */
        contextMenu(item, event) {
            // el type
            const type = item.type === 'dir' ? 'directories' : 'files';
            // search in selected array
            const alreadySelected = this.selected[type].includes(item.path);

            // select this element
            if (!alreadySelected) {
                // select item
                this.$store.commit(`fm/${this.manager}/changeSelected`, {
                    type,
                    path: item.path,
                });
            }

            // create event
            EventBus.emit('contextMenu', event);
        },

        /**
         * Select and Action
         * @param path
         * @param extension
         */
        selectAction(path, extension) {
            // if is set fileCallback
            if (this.$store.state.fm.fileCallback) {
                this.$store
                    .dispatch('fm/url', {
                        disk: this.selectedDisk,
                        path,
                    })
                    .then((response) => {
                        if (response.data.result.status === 'success') {
                            this.$store.state.fm.fileCallback(response.data.url);
                        }
                    });

                return;
            }

            // if extension not defined
            if (!extension) {
                return;
            }

            // show, play..
            if (this.$store.state.fm.settings.imageExtensions.includes(extension.toLowerCase())) {
                // Open viewerjs modal instead of PreviewModal
                this.openViewerjsModal(path);
            } else if (Object.keys(this.$store.state.fm.settings.textExtensions).includes(extension.toLowerCase())) {
                // show text file
                this.$store.commit('fm/modal/setModalState', {
                    modalName: 'TextEditModal',
                    show: true,
                });
            } else if (this.$store.state.fm.settings.audioExtensions.includes(extension.toLowerCase())) {
                // show player modal
                this.$store.commit('fm/modal/setModalState', {
                    modalName: 'AudioPlayerModal',
                    show: true,
                });
            } else if (this.$store.state.fm.settings.videoExtensions.includes(extension.toLowerCase())) {
                // show player modal
                this.$store.commit('fm/modal/setModalState', {
                    modalName: 'VideoPlayerModal',
                    show: true,
                });
            } else if (extension.toLowerCase() === 'pdf') {
                // show pdf document
                this.$store.dispatch('fm/openPDF', {
                    disk: this.selectedDisk,
                    path,
                });
            }
        },

        /**
         * Open viewerjs modal for images
         * @param {string} selectedPath - Path of the selected image
         */
        async openViewerjsModal(selectedPath) {
            // Get all image files from current directory
            const imageFiles = this.files.filter((file) =>
                this.$store.state.fm.settings.imageExtensions.includes(file.extension.toLowerCase())
            );

            if (imageFiles.length === 0) {
                return;
            }

            // Create a temporary container for images
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.top = '-9999px';
            container.style.left = '-9999px';
            container.style.visibility = 'hidden';
            document.body.appendChild(container);

            // Create image elements for viewerjs
            const images = [];
            let selectedIndex = 0;
            const auth = this.$store.getters['fm/settings/authHeader'];

            // Build URLs for all images
            const urlPromises = imageFiles.map((file) => {
                if (auth) {
                    return this.$store
                        .dispatch('fm/url', {
                            disk: this.selectedDisk,
                            path: file.path,
                        })
                        .then((response) => {
                            if (response.data.result.status === 'success') {
                                return response.data.url;
                            }
                            return null;
                        });
                }
                return Promise.resolve(
                    `${this.$store.getters['fm/settings/baseUrl']}preview?disk=${this.selectedDisk
                    }&path=${encodeURIComponent(file.path)}&v=${file.timestamp}`
                );
            });

            const urls = await Promise.all(urlPromises);

            // Create image elements with URLs
            for (let i = 0; i < imageFiles.length; i += 1) {
                const file = imageFiles[i];
                const img = document.createElement('img');

                if (urls[i]) {
                    img.src = urls[i];
                }

                img.alt = file.basename;
                img.setAttribute('data-viewer', '');
                container.appendChild(img);
                images.push(img);

                if (file.path === selectedPath) {
                    selectedIndex = i;
                }
            }

            // Wait for images to load
            await Promise.all(
                images.map(
                    (imgElement) =>
                        new Promise((resolve) => {
                            if (imgElement.complete) {
                                resolve();
                            } else {
                                const loadHandler = () => {
                                    resolve();
                                };
                                imgElement.addEventListener('load', loadHandler);
                                imgElement.addEventListener('error', loadHandler);
                            }
                        })
                )
            );

            // Initialize viewerjs
            const viewer = new Viewer(container, {
                inline: false,
                backdrop: true,
                toolbar: {
                    zoomIn: true,
                    zoomOut: true,
                    reset: true,
                    rotateLeft: true,
                    rotateRight: true,
                    flipHorizontal: true,
                    flipVertical: true,
                },
                viewed: (event) => {
                    // Clean up when viewer is closed
                    if (event.detail.index === undefined || event.detail.index === -1) {
                        viewer.destroy();
                        if (container.parentNode) {
                            document.body.removeChild(container);
                        }
                    }
                },
                hidden: () => {
                    // Clean up when viewer is hidden
                    viewer.destroy();
                    if (container.parentNode) {
                        document.body.removeChild(container);
                    }
                },
            });

            // Show the selected image
            viewer.view(selectedIndex);
        },
    },
};
