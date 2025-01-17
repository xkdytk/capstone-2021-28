var BBoxSelector;

BBoxSelector = (function() {
    function BBoxSelector(image_frame, options) {
        if (options == null) {
            options = {};
        }
        options.input_method || (options.input_method = "text");
        this.image_frame = image_frame;
        this.border_width = options.border_width || 2;
        this.selector = $('<div class="bbox_selector"></div>');
        this.selector.css({
            "border": this.border_width + "px dotted rgb(127,255,127)",
            "position": "absolute"
        });
        this.image_frame.append(this.selector);
        this.selector.css({
            "border-width": this.border_width
        });
        this.selector.hide();
        this.create_label_box(options);
    }

    BBoxSelector.prototype.create_label_box = function(options) {
        var i, label, len, ref;
        options.labels || (options.labels = ["object"]);
        this.label_box = $('<div class="label_box"></div>');
        this.label_box.css({
            "position": "absolute"
        });
        this.image_frame.append(this.label_box);
        switch (options.input_method) {
            case 'select':
                if (typeof options.labels === "string") {
                    options.labels = [options.labels];
                }
                this.label_input = $('<select class="label_input" name="label"></select>');
                this.label_box.append(this.label_input);
                this.label_input.append($('<option value>choose an item</option>'));
                ref = options.labels;
                for (i = 0, len = ref.length; i < len; i++) {
                    label = ref[i];
                    this.label_input.append('<option value="' + label + '">' + label + '</option>');
                }
                this.label_input.change(function(e) {
                    return this.blur();
                });
                break;
            case 'text':
                if (typeof options.labels === "string") {
                    options.labels = [options.labels];
                }
                this.label_input = $('<input class="label_input" name="label" ' + 'type="text" value>');
                this.label_box.append(this.label_input);
                this.label_input.autocomplete({
                    source: options.labels || [''],
                    autoFocus: true
                });
                break;
            case 'fixed':
                if ($.isArray(options.labels)) {
                    options.labels = options.labels[0];
                }
                this.label_input = $('<input class="label_input" name="label" type="text">');
                this.label_box.append(this.label_input);
                this.label_input.val(options.labels);
                break;
            default:
                throw 'Invalid label_input parameter: ' + options.input_method;
        }
        return this.label_box.hide();
    };

    BBoxSelector.prototype.crop = function(pageX, pageY) {
        var point;
        return point = {
            x: Math.min(Math.max(Math.round(pageX - this.image_frame.offset().left), 0), Math.round(this.image_frame.width() - 1)),
            y: Math.min(Math.max(Math.round(pageY - this.image_frame.offset().top), 0), Math.round(this.image_frame.height() - 1))
        };
    };

    BBoxSelector.prototype.start = function(pageX, pageY) {
        this.pointer = this.crop(pageX, pageY);
        this.offset = this.pointer;
        this.refresh();
        this.selector.show();
        $('body').css('cursor', 'crosshair');
        return document.onselectstart = function() {
            return false;
        };
    };

    BBoxSelector.prototype.update_rectangle = function(pageX, pageY) {
        this.pointer = this.crop(pageX, pageY);
        return this.refresh();
    };

    BBoxSelector.prototype.input_label = function(options) {
        $('body').css('cursor', 'default');
        document.onselectstart = function() {
            return true;
        };
        this.label_box.show();
        return this.label_input.focus();
    };

    BBoxSelector.prototype.finish = function(options) {
        var data;
        this.label_box.hide();
        this.selector.hide();
        data = this.rectangle();
        data.label = $.trim(this.label_input.val().toLowerCase());
        if (options.input_method !== 'fixed') {
            this.label_input.val('');
        }
        return data;
    };

    BBoxSelector.prototype.rectangle = function() {
        var rect, x1, x2, y1, y2;
        x1 = Math.min(this.offset.x, this.pointer.x);
        y1 = Math.min(this.offset.y, this.pointer.y);
        x2 = Math.max(this.offset.x, this.pointer.x);
        y2 = Math.max(this.offset.y, this.pointer.y);
        return rect = {
            left: x1,
            top: y1,
            width: x2 - x1 + 1,
            height: y2 - y1 + 1
        };
    };

    BBoxSelector.prototype.refresh = function() {
        var rect;
        rect = this.rectangle();
        this.selector.css({
            left: (rect.left - this.border_width) + 'px',
            top: (rect.top - this.border_width) + 'px',
            width: rect.width + 'px',
            height: rect.height + 'px'
        });
        return this.label_box.css({
            left: (rect.left - this.border_width) + 'px',
            top: (rect.top + rect.height + this.border_width) + 'px'
        });
    };

    BBoxSelector.prototype.get_input_element = function() {
        return this.label_input;
    };

    return BBoxSelector;

})();

this.BBoxAnnotator = (function() {
    function BBoxAnnotator(options) {
        var annotator, image_element;
        annotator = this;
        this.annotator_element = $(options.id || "#bbox_annotator");
        this.border_width = options.border_width || 2;
        this.show_label = options.show_label || (options.input_method !== "fixed");
        if (options.multiple != null) {
            this.multiple = options.multiple;
        } else {
            this.multiple = true;
        }
        this.image_frame = $('<div class="image_frame"></div>');
        this.annotator_element.append(this.image_frame);
        if (options.guide) {
            annotator.initialize_guide(options.guide);
        }
        image_element = new Image();
        image_element.src = options.url;
        image_element.onload = function() {
            options.width || (options.width = image_element.width);
            options.height || (options.height = image_element.height);
            annotator.annotator_element.css({
                "width": (options.width + annotator.border_width) + 'px',
                "height": (options.height + annotator.border_width) + 'px',
                "padding-left": (annotator.border_width / 2) + 'px',
                "padding-top": (annotator.border_width / 2) + 'px',
                "cursor": "crosshair",
                "overflow": "hidden"
            });
            annotator.image_frame.css({
                "background-image": "url('" + image_element.src + "')",
                "width": options.width + "px",
                "height": options.height + "px",
                "position": "relative"
            });
            annotator.selector = new BBoxSelector(annotator.image_frame, options);
            return annotator.initialize_events(options);
        };
        image_element.onerror = function() {
            return annotator.annotator_element.text("Invalid image URL: " + options.url);
        };
        this.entries = [];
        this.onchange = options.onchange;
    }

    BBoxAnnotator.prototype.initialize_events = function(options) {
        var annotator, selector, status;
        status = 'free';
        this.hit_menuitem = false;
        annotator = this;
        selector = annotator.selector;
        this.annotator_element.mousedown(function(e) {
            if (!annotator.hit_menuitem) {
                switch (status) {
                    case 'free':
                    case 'input':
                        if (status === 'input') {
                            selector.get_input_element().blur();
                        }
                        if (e.which === 1) {
                            selector.start(e.pageX, e.pageY);
                            status = 'hold';
                        }
                }
            }
            annotator.hit_menuitem = false;
            return true;
        });
        $(window).mousemove(function(e) {
            var offset;
            switch (status) {
                case 'hold':
                    selector.update_rectangle(e.pageX, e.pageY);
            }
            if (annotator.guide_h) {
                offset = annotator.image_frame.offset();
                annotator.guide_h.css('top', Math.floor(e.pageY - offset.top) + 'px');
                annotator.guide_v.css('left', Math.floor(e.pageX - offset.left) + 'px');
            }
            return true;
        });
        $(window).mouseup(function(e) {
            switch (status) {
                case 'hold':
                    selector.update_rectangle(e.pageX, e.pageY);
                    selector.input_label(options);
                    status = 'input';
                    if (options.input_method === 'fixed') {
                        selector.get_input_element().blur();
                    }
            }
            return true;
        });
        selector.get_input_element().blur(function(e) {
            var data;
            switch (status) {
                case 'input':
                    data = selector.finish(options);
                    if (data.label) {
                        annotator.add_entry(data);
                        if (annotator.onchange) {
                            annotator.onchange(annotator.entries);
                        }
                    }
                    status = 'free';
            }
            return true;
        });
        selector.get_input_element().keypress(function(e) {
            switch (status) {
                case 'input':
                    if (e.which === 13) {
                        selector.get_input_element().blur();
                    }
            }
            return e.which !== 13;
        });
        selector.get_input_element().mousedown(function(e) {
            return annotator.hit_menuitem = true;
        });
        selector.get_input_element().mousemove(function(e) {
            return annotator.hit_menuitem = true;
        });
        selector.get_input_element().mouseup(function(e) {
            return annotator.hit_menuitem = true;
        });
        return selector.get_input_element().parent().mousedown(function(e) {
            return annotator.hit_menuitem = true;
        });
    };

    BBoxAnnotator.prototype.add_entry = function(entry) {
        var annotator, box_element, close_button, text_box;
        if (!this.multiple) {
            this.annotator_element.find(".annotated_bounding_box").detach();
            this.entries.splice(0);
        }
        this.entries.push(entry);
        box_element = $('<div class="annotated_bounding_box"></div>');
        box_element.appendTo(this.image_frame).css({
            "border": this.border_width + "px solid rgb(127,255,127)",
            "position": "absolute",
            "top": (entry.top - this.border_width) + "px",
            "left": (entry.left - this.border_width) + "px",
            "width": entry.width + "px",
            "height": entry.height + "px",
            "color": "rgb(127,255,127)",
            "font-family": "monospace",
            "font-size": "small"
        });
        close_button = $('<div></div>').appendTo(box_element).css({
            "position": "absolute",
            "top": "-8px",
            "right": "-8px",
            "width": "16px",
            "height": "0",
            "padding": "16px 0 0 0",
            "overflow": "hidden",
            "color": "#fff",
            "background-color": "#030",
            "border": "2px solid #fff",
            "-moz-border-radius": "18px",
            "-webkit-border-radius": "18px",
            "border-radius": "18px",
            "cursor": "pointer",
            "-moz-user-select": "none",
            "-webkit-user-select": "none",
            "user-select": "none",
            "text-align": "center"
        });
        $("<div></div>").appendTo(close_button).html('&#215;').css({
            "display": "block",
            "text-align": "center",
            "width": "16px",
            "position": "absolute",
            "top": "-2px",
            "left": "0",
            "font-size": "16px",
            "line-height": "16px",
            "font-family": '"Helvetica Neue", Consolas, Verdana, Tahoma, Calibri, ' + 'Helvetica, Menlo, "Droid Sans", sans-serif'
        });
        text_box = $('<div></div>').appendTo(box_element).css({
            "overflow": "hidden"
        });
        if (this.show_label) {
            text_box.text(entry.label);
        }
        annotator = this;
        box_element.hover((function(e) {
            return close_button.show();
        }), (function(e) {
            return close_button.hide();
        }));
        close_button.mousedown(function(e) {
            return annotator.hit_menuitem = true;
        });
        close_button.click(function(e) {
            var clicked_box, index;
            clicked_box = close_button.parent(".annotated_bounding_box");
            index = clicked_box.prevAll(".annotated_bounding_box").length;
            clicked_box.detach();
            annotator.entries.splice(index, 1);
            return annotator.onchange(annotator.entries);
        });
        return close_button.hide();
    };

    BBoxAnnotator.prototype.clear_all = function(e) {
        this.annotator_element.find(".annotated_bounding_box").detach();
        this.entries.splice(0);
        return this.onchange(this.entries);
    };

    BBoxAnnotator.prototype.initialize_guide = function(options) {
        this.guide_h = $('<div class="guide_h"></div>').appendTo(this.image_frame).css({
            "border": "1px dotted " + (options.color || '#000'),
            "height": "0",
            "width": "100%",
            "position": "absolute",
            "top": "0",
            "left": "0"
        });
        return this.guide_v = $('<div class="guide_v"></div>').appendTo(this.image_frame).css({
            "border": "1px dotted " + (options.color || '#000'),
            "height": "100%",
            "width": "0",
            "position": "absolute",
            "top": "0",
            "left": "0"
        });
    };

    return BBoxAnnotator;

})();

// ---
// generated by coffee-script 1.9.2