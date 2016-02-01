(function() {
    var exports,
        console = window.console,
        current_mode,
        SUPPORTED_GRID_NUMBERS = [9, 4],
        OUTPUT_SIZES = [1200, 500, 300],
        SPOTIFY_IMAGE_WIDTH = 640;


    // Square box views

    var squared_box = $('.squared-box'),
        squared_box_dom = $('.squared-box')[0];

    var adjustSquaredHeight = function() {
        squared_box.height(squared_box.width());
    };

    var _createOption = function(value, text) {
        var el = $('<option></option>');
        el.val(value);
        el.html(text);
        return el;
    };

    var setGridMode = function(number) {
        if (SUPPORTED_GRID_NUMBERS.indexOf(number) === -1) {
            alert('Not supported yet');
            current_mode = undefined;
            return;
        }

        // Remove redundant grid items
        squared_box.find('.grid-item').each(function(i) {
            if (i >= number) {
                $(this).remove();
            }
        });

        // Set class name for squared box
        SUPPORTED_GRID_NUMBERS.forEach(function(n) {
            if (n === number) {
                squared_box.addClass('-grids-' + n);
            } else {
                squared_box.removeClass('-grids-' + n);
            }
        });

        // Update size select
        var size_select = settings_box.find('select[name=size]'),
            sqrt = Math.sqrt(number),
            origin_size = sqrt * SPOTIFY_IMAGE_WIDTH;
        size_select.empty();
        size_select.append(
            _createOption(origin_size, 'origin (' + origin_size + 'X' + origin_size + ')')
        );
        OUTPUT_SIZES.forEach(function(s) {
            if (s <= origin_size)
                size_select.append(_createOption(s, s + 'X' + s));
        });

        // Update global state
        current_mode = {
            grid_number: number
        };
    };

    var checkGridNumber = function() {
        if (squared_box.find('.grid-item').length >= current_mode.grid_number) {
            console.log('squared box is full, max grid number reached');
            return false;
        }
        return true;
    };

    // XXX ensure every image is loaded
    var drawGridCanvas = function(grid_number, image_width, $images) {
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
            var x = (seq % sqrt) * image_width,
                y = Math.floor((seq / sqrt)) * image_width;
            ctx.drawImage(img, x, y, image_width, image_width);
        };

        // draw each image
        $images.each(function(i, img) {
            drawGrid(img, i);
        });
        return canvas;
    };

    var initSquaredBox = function() {
        // Adjust height on resize
        $(window).on('resize', function() {
            adjustSquaredHeight();
        });
        $(window).trigger('resize');

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
            // console.log(' grid changed');
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
        settings_box.find('select[name=grid_number]').on('change', function() {
            var grid_number = Number(this.value);
            console.log('change grid number', grid_number);
            setGridMode(grid_number);
        }).trigger('change');  // Manually trigger change to set grid number for the first time

        settings_box.find('.download').on('click', function() {
            var images = squared_box.find('.grid-item > img'),
                // image_width = images[0].width;
                image_width = SPOTIFY_IMAGE_WIDTH;
            if (!images.length) {
                alert('Please select at least one image in the grid box');
                return;
            }

            // Create grid canvas
            var canvas = drawGridCanvas(current_mode.grid_number, image_width, images);

            // Get size for save
            var size = settings_box.find('select[name=size]').val();
            if (size === 'origin') {
                size = canvas.width;
            } else {
                size = Number(size);
            }

            // Get type for save
            var filetype = settings_box.find('select[name=filetype]').val();

            // Save that canvas
            console.log('save args:', size, filetype);
            canvas_util.saveCanvasImage(canvas, size, 'artwork', filetype);
        });

        /*jshint multistr: true */
        var text = "squared is a small tool for creating grid layout images \
        from a list of songs, it's a gift for a friend \
        to express appreciation for his great music taste and recommending music to me. \
        Currently squared only supports making 9x9 grid layout from Spotify playlist url, \
        if further need is shown, I can extend it to support more layouts and sources. :)";
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
                    return checkGridNumber();
                },
                draggable: '.grid-item',
                animation: 150,
            });
        });

        // Bind click
        container.on('click', 'li .grid-item', function(e) {
            if (!checkGridNumber())
                return;
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


    exports = {
        initSquaredBox: initSquaredBox,
        initSettingsBox: initSettingsBox,
        initURLBox: initURLBox,
    };

    window.views = exports;
})();
