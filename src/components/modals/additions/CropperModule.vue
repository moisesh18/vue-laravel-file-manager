<template>
    <div class="fm-additions-cropper">
        <div class="row" v-bind:style="{ 'max-height': maxHeight + 'px' }">
            <div class="col-12 cropper-block">
                <img v-bind:src="imgSrc" ref="fmCropper" v-bind:alt="selectedItem.basename" />
            </div>
        </div>
        <div class="d-flex justify-content-between">
            <div>
                <div class="btn-group me-2" role="group" aria-label="Scale">
                    <button v-on:click="cropMove(-10, 0)" type="button" class="btn btn-info">
                        <i class="bi bi-arrow-left"></i>
                    </button>
                    <button v-on:click="cropMove(10, 0)" type="button" class="btn btn-info">
                        <i class="bi bi-arrow-right"></i>
                    </button>
                    <button v-on:click="cropMove(0, -10)" type="button" class="btn btn-info">
                        <i class="bi bi-arrow-up"></i>
                    </button>
                    <button v-on:click="cropMove(0, 10)" type="button" class="btn btn-info">
                        <i class="bi bi-arrow-down"></i>
                    </button>
                </div>
                <div class="btn-group me-2" role="group" aria-label="Scale">
                    <button v-on:click="cropScaleX()" type="button" class="btn btn-info">
                        <i class="bi bi-arrow-left-right"></i>
                    </button>
                    <button v-on:click="cropScaleY()" type="button" class="btn btn-info">
                        <i class="bi bi-arrow-down-up"></i>
                    </button>
                </div>
                <div class="btn-group me-2" role="group" aria-label="Rotate">
                    <button v-on:click="cropRotate(-45)" type="button" class="btn btn-info">
                        <i class="bi bi-arrow-counterclockwise"></i>
                    </button>
                    <button v-on:click="cropRotate(45)" type="button" class="btn btn-info">
                        <i class="bi bi-arrow-clockwise"></i>
                    </button>
                </div>
                <div class="btn-group me-2" role="group" aria-label="Rotate">
                    <button v-on:click="cropZoom(0.1)" type="button" class="btn btn-info">
                        <i class="bi bi-plus-circle"></i>
                    </button>
                    <button v-on:click="cropZoom(-0.1)" type="button" class="btn btn-info">
                        <i class="bi bi-dash-circle"></i>
                    </button>
                </div>
                <button
                    v-on:click="cropReset()"
                    v-bind:title="lang.modal.cropper.reset"
                    type="button"
                    class="btn btn-info me-2"
                >
                    <i class="bi bi-arrow-repeat"></i>
                </button>
                <button
                    v-on:click="cropSave()"
                    v-bind:title="lang.modal.cropper.save"
                    type="button"
                    class="btn btn-primary me-2"
                >
                    <i class="bi bi-floppy-fill"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { nextTick } from 'vue';
import Cropper from 'cropperjs';
import translate from '../../../mixins/translate';

export default {
    name: 'CropperModule',
    mixins: [translate],
    props: {
        imgSrc: { required: true },
        maxHeight: { type: Number, required: true },
    },
    data() {
        return {
            cropper: null,
        };
    },
    mounted() {
        nextTick(() => {
            this.cropper = new Cropper(this.$refs.fmCropper, {});
        });
    },
    beforeUnmount() {
        if (this.cropper && typeof this.cropper.destroy === 'function') {
            this.cropper.destroy();
            this.cropper = null;
        }
    },
    computed: {
        /**
         * Selected file
         * @returns {*}
         */
        selectedItem() {
            return this.$store.getters['fm/selectedItems'][0];
        },
    },
    methods: {
        /**
         * Move
         * @param x
         * @param y
         */
        cropMove(x, y) {
            this.cropper.move(x, y);
        },

        /**
         * Scale - mirroring Y
         */
        cropScaleY() {
            this.cropper.scale(1, this.cropper.getData().scaleY === 1 ? -1 : 1);
        },

        /**
         * Scale - mirroring X
         */
        cropScaleX() {
            this.cropper.scale(this.cropper.getData().scaleX === 1 ? -1 : 1, 1);
        },

        /**
         * Rotate
         * @param grade
         */
        cropRotate(grade) {
            this.cropper.rotate(grade);
        },

        /**
         * Zoom
         * @param ratio
         */
        cropZoom(ratio) {
            this.cropper.zoom(ratio);
        },

        /**
         * Reset
         */
        cropReset() {
            this.cropper.reset();
        },

        /**
         * Save cropped image
         */
        cropSave() {
            this.cropper.getCroppedCanvas().toBlob(
                (blob) => {
                    const formData = new FormData();
                    formData.append('disk', this.$store.getters['fm/selectedDisk']);
                    formData.append('path', this.selectedItem.dirname);
                    formData.append('file', blob, this.selectedItem.basename);

                    this.$store.dispatch('fm/updateFile', formData).then((response) => {
                        if (response.data.result.status === 'success') {
                            this.$emit('closeCropper');
                        }
                    });
                },
                this.selectedItem.extension !== 'jpg' ? `image/${this.selectedItem.extension}` : 'image/jpeg'
            );
        },
    },
};
</script>

<style lang="scss">
@import 'cropperjs/dist/cropper.css';

.fm-additions-cropper {
    overflow: hidden;

    button > i {
        color: white;
        font-weight: bold;
    }

    .cropper-block {
        overflow: hidden;

        img {
            max-width: 100%;
        }
    }

    & > .d-flex {
        padding: 1rem;
        border-top: 1px solid #e9ecef;
    }
}
</style>
