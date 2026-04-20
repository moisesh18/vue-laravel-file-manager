<template>
    <div class="modal-content fm-modal-cropper">
        <div class="modal-header">
            <h5 class="modal-title w-75 text-truncate">
                {{ lang.modal.cropper.title }}
                <small class="text-muted pl-3">{{ selectedItem.basename }}</small>
            </h5>
            <button type="button" class="btn-close" aria-label="Close" v-on:click="hideModal"></button>
        </div>
        <div class="modal-body p-0">
            <div v-if="!imgSrc" class="text-center py-5">
                <div class="spinner-border spinner-border-lg text-muted">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
            <cropper-module
                v-else
                v-bind:imgSrc="imgSrc"
                v-bind:maxHeight="maxHeight"
                v-on:closeCropper="onCropperClose"
            />
        </div>
    </div>
</template>

<script>
import CropperModule from '../additions/CropperModule.vue';
import modal from '../mixins/modal';
import translate from '../../../mixins/translate';
import GET from '../../../http/get';

export default {
    name: 'CropperModal',
    mixins: [modal, translate],
    components: { CropperModule },
    data() {
        return {
            imgSrc: null,
        };
    },
    mounted() {
        this.loadImage();
    },
    computed: {
        auth() {
            return this.$store.getters['fm/settings/authHeader'];
        },

        selectedDisk() {
            return this.$store.getters['fm/selectedDisk'];
        },

        selectedItem() {
            return this.$store.getters['fm/selectedItems'][0];
        },

        maxHeight() {
            if (this.$store.state.fm.modal.modalBlockHeight) {
                return this.$store.state.fm.modal.modalBlockHeight - 170;
            }

            return 300;
        },
    },
    methods: {
        loadImage() {
            if (this.auth) {
                GET.preview(this.selectedDisk, this.selectedItem.path).then((response) => {
                    const mimeType = response.headers['content-type'].toLowerCase();
                    const imgBase64 = Buffer.from(response.data, 'binary').toString('base64');

                    this.imgSrc = `data:${mimeType};base64,${imgBase64}`;
                });
            } else {
                this.imgSrc = `${this.$store.getters['fm/settings/baseUrl']}preview?disk=${
                    this.selectedDisk
                }&path=${encodeURIComponent(this.selectedItem.path)}&v=${this.selectedItem.timestamp}`;
            }
        },

        onCropperClose() {
            this.hideModal();
        },
    },
};
</script>

<style lang="scss">
.fm-modal-cropper {
    .modal-body {
        padding: 0;
    }
}
</style>
