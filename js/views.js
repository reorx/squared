(function() {
    var exports,
        console = window.console,
        current_mode,
        support_modes = [9],
        SPOTIFY_IMAGE_WIDTH = 640;


    // Square box views

    var squared_box = $('.squared-box'),
        squared_box_dom = $('.squared-box')[0];

    var adjustSquaredHeight = function() {
        squared_box.height(squared_box.width());
    };

    var setGridMode = function(number) {
        if (support_modes.indexOf(number) === -1) {
            alert('Not supported yet');
            current_mode = undefined;
            return;
        }
        squared_box.addClass('-grids-' + number);
        current_mode = {
            grid_number: number
        };
    };

    var initSquaredBox = function() {
        // Make sortable
        Sortable.create(squared_box_dom, {
            group: {
                name: 'default',
                pull: false,
            },
            animation: 200,
            filter: '.close',
            onAdd: function() {
                squared_box.trigger('grid_changed');
            }
        });

        // Disable placehold dragging
        squared_box.find('.placeholder').on('dragstart', function(e) {
            e.preventDefault();
        });

        // Bind grid_change
        squared_box.on('grid_changed', function() {
            console.log(' grid changed');
            var placeholder = squared_box.find('.placeholder');
            if (squared_box.find('.grid-item').length) {
                placeholder.hide();
            } else {
                placeholder.show();
            }
        });

        // Bind click close
        squared_box.on('click',  '.close', function(e) {
            $(e.target).closest('.grid-item').remove();
            squared_box.trigger('grid_changed');
        });
    };


    // Settings box views

    var settings_box = $('.settings-box');

    var initSettingsBox = function() {
        settings_box.find('.download').on('click', function() {
            var images = squared_box.find('.grid-item > img'),
                size = settings_box.find('select[name=size]').val();
            if (size === 'origin') {
                size = undefined;
            } else {
                size = Number(size);
            }
            console.log('download size', size);
            if (!images.length) {
                alert('Please select at least one image in the grid box');
                return;
            }
            // var image_width = images[0].width;
            var image_width = SPOTIFY_IMAGE_WIDTH;
            var canvas = drawGridCanvas(current_mode.grid_number, image_width, images);
            downloadCanvasImage(canvas, 'artwork', size);
        });

        var text = "squared is a small tool for creating grid layout images \
        from a list of songs, it's a gift for a friend \
        to express appreciation for his great music taste and recommending music to me. \
        Currently squared only supports making 9x9 grid layout from Spotify playlist url, \
        if further need is shown, I can extend it to support more layouts and sources. :)"
        settings_box.find('.whatsthis').on('click', function() {
            swal({
                title: 'Squared',
                text: text,
                imageUrl: '/favicon.ico',
                customClass: '_alignleft',
                confirmButtonText: 'I Got It',
            });
        });
    };


    // URL box views

    var url_box = $('.url-box');

    var initURLBox = function() {
        var url_input = url_box.find('input[name=url]');

        url_box.find('form').on('submit', function(e) {
            // console.log('submit', this.value);
            e.preventDefault();
            var url = url_input.val();
            if (!url)
                return;
            url_input.prop('disabled', true);
            renderPlaylist(url).always(function() {
                url_input.prop('disabled', false);
            });
        });
    };


    // Playlist views

    var renderPlaylist = function(url) {
        var $playlist = $('.play-list'),
            $placeholder = $playlist.find('.placeholder'),
            $loading = $playlist.find('.loading'),
            $content = $playlist.find('ul'),
            $statusbar = $('.status-bar');

        $placeholder.hide();
        $content.hide();
        $loading.show().css('display', 'flex');
        return fetchPlaylist(url).then(function(json) {
            _renderPlaylist(json, $content, $statusbar);

            $loading.hide();
            $content.show();
        }, function(jqxhr) {
            // status, responseText
            swal({
                title: 'Failed to parse url',
                text: 'Please make sure you have input a valid playlist url',
                type: 'error',
            });
            console.warn('failed', arguments);
        });
    };

    var playlist_template = Handlebars.compile($('#playlist-template').html());

    var _renderPlaylist = function(json, container, statusbar) {
        statusbar.html('Total: ' + json.length + ' songs');
        var rendered = $(playlist_template({playlist: json}));

        container.html(rendered);
        // Make sortable
        container.find('li .grid-item-wrapper').each(function() {
            Sortable.create(this, {
                group: {
                    name: 'default',
                    pull: 'clone',
                    put: false,
                },
                onMove: function (e) {
                    if (e.to !== squared_box_dom)
                        return;
                    if (squared_box.find('.grid-item').length >= current_mode.grid_number) {
                        console.log('grid box is full');
                        return false;
                    }
                },
                draggable: '.grid-item',
                animation: 150,
            });
        });

        // Bind click
        container.on('click', 'li .grid-item', function(e) {
            console.log('click grid item', this, e.target);
            var grid_item = $(e.target).closest('.grid-item');
            grid_item.clone().appendTo(squared_box);
            squared_box.trigger('grid_changed');
        });
    };

    var fetchPlaylist = function(url) {
        return $.ajax({
            url: '/api/get_spotify_playlist',
            type: 'POST',
            data: {
                playlist_url: url
            }
        });
    };


    // Canvas views

    // XXX ensure every image is loaded
    var drawGridCanvas = function(grid_number, image_width, images) {
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            sqrt = Math.sqrt(grid_number);
        // adjust size
        canvas.width = image_width * sqrt;
        canvas.height = image_width * sqrt;
        // set background
        ctx.fillStyle = '#eee';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        var drawGrid = function(img, seq) {
            var x = (seq % 3) * image_width,
                y = Math.floor((seq / 3)) * image_width;
            ctx.drawImage(img, x, y, image_width, image_width);
        };

        // draw each image
        images.each(function(i, img) {
            drawGrid(img, i);
        });
        return canvas;
    };

    var downloadCanvasImage = function(canvas, filename, size) {
        var a = document.createElement('a'),
            class_name = '_canvas-downloader',
            resized_canvas;
        $('.' + class_name).remove();

        // resize
        if (size === undefined) {
            size = SPOTIFY_IMAGE_WIDTH * 3;
        }
        if (canvas.width === size) {
            console.log('no need to resize');
            resized_canvas = canvas;
        } else {
            resized_canvas = document.createElement('canvas');
            resized_canvas.width = size;
            resized_canvas.height = size;
            var rctx = resized_canvas.getContext('2d');
            rctx.drawImage(canvas,
                0, 0, canvas.width, canvas.height,
                0, 0, resized_canvas.width, resized_canvas.height);
        }

        a.href = resized_canvas.toDataURL('image/jpeg', 1.0);
        a.download = filename + '-' + size + 'X' + size + '.jpeg';
        a.className = class_name;
        document.body.appendChild(a);
        a.click();
    };


    exports = {
        adjustSquaredHeight: adjustSquaredHeight,
        initSquaredBox: initSquaredBox,
        setGridMode: setGridMode,
        initSettingsBox: initSettingsBox,
        initURLBox: initURLBox,
    };

    window.views = exports;
})();
