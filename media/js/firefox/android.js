/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

;(function($) {
    'use strict';

    var isOldIE = (/MSIE\s[1-7]\./.test(navigator.userAgent));

    // slideshow/accordion variables
    var customizeAccordion;
    var $phoneWrapper = $('#phone-wrapper');
    var $screencastWrapper = $('#screencast-wrapper');
    var $phoneScreens = $('#phone-screens');
    var $screencastImages = $('#screencast-images');
    var $slideshows = $('.slideshow');
    var screencastVisible = false;
    var slideshowRunning = false;
    var cycleOpts = {
        speed: 500,
        timeout: 2700
    };

    // move screencast images into the slideshow container
    $screencastImages.append($('#screencast .media-desktop').html());

    // hide download buttons from Android users
    if (isFirefox() && window.site.platform === 'android') {
        $('.dl-button-wrapper').hide();

        $('#subscribe-wrapper').removeClass('floating');
    }

    // stops any running slideshow
    var stopSlideshow = function() {
        // stop slideshow
        if (slideshowRunning) {
            $slideshows.cycle('destroy');
            slideshowRunning = false;
        }
    };

    var startPhoneScreenSlideshow = function(sectionId) {
        // if new markup has more than one image, start a slideshow
        if ($phoneScreens.children('img').length > 1) {
            // addons/faves should slide while others (search) should fade
            cycleOpts.fx = (sectionId === 'addons') ? 'scrollHorz' : 'fade';

            $phoneScreens.cycle(cycleOpts);

            slideshowRunning = true;
        }
    };

    // replaces content of phone container with specified image(s)
    var setPhoneScreen = function(markup, sectionId) {
        // processing for all sections except screencast
        if (sectionId !== 'screencast') {
            $phoneScreens.empty().append(markup);

            // if currently displaying screencasts, fade out/in wrappers
            if (screencastVisible) {
                $screencastWrapper.fadeOut('fast', function() {
                    stopSlideshow();

                    $phoneWrapper.fadeIn('fast');

                    startPhoneScreenSlideshow(sectionId);
                });

                screencastVisible = false;
            } else {
                stopSlideshow();

                startPhoneScreenSlideshow(sectionId);
            }
        } else {
            if (!screencastVisible) {
                $phoneWrapper.fadeOut('fast', function() {
                    stopSlideshow();

                    $screencastWrapper.fadeIn('fast');

                    // we know screencast should have a slideshow
                    $screencastImages.cycle(cycleOpts);
                });

                screencastVisible = true;
            } else {
                stopSlideshow();

                // we know screencast should have a slideshow
                $screencastImages.cycle(cycleOpts);
            }

            slideshowRunning = true;
        }
    };

    var initAccordionsDesktop = function() {
        customizeAccordion = new Mozilla.Accordion($('#customize-accordion'));
        var hasExpanded = -1;

        // if no accordions are open, open the first section
        for (var i = 0; i < customizeAccordion.sections.length; i++) {
            if (customizeAccordion.sections[i].expanded) {
                hasExpanded = i;
                break;
            }
        }

        // if no section is expanded from previous visit
        if (hasExpanded === -1) {
            // open first section
            customizeAccordion.sections[0].expand();

            // display phone wrapper
            $phoneWrapper.fadeIn('fast');

            // update phone screen
            setPhoneScreen($('#broadcast').find('.media-desktop').html());
        } else {
            // if going from mobile view, multiple sections could be expanded
            // make sure only the first stays expanded - collapse the rest
            var section;

            for (var j = 0; j < customizeAccordion.sections.length; j++) {
                section = customizeAccordion.sections[j];

                if (section.expanded && j !== hasExpanded) {
                    section.collapse();
                }
            }

            // update phone screen to match auto-expanded section
            var $expandedSection = $('#' + customizeAccordion.sections[hasExpanded].id);

            // if not showing screencast section on page load, fade in phone wrapper
            if ($expandedSection.prop('id') !== 'screencast') {
                $phoneWrapper.fadeIn('fast');
            }

            setPhoneScreen($expandedSection.find('.media-desktop').html(), $expandedSection.prop('id'));
        }

        // add custom handlers to accordion tabs
        $('.accordion [data-accordion-role="tab"]').on('click.android-desktop', function() {
            var $tab = $(this);

            // only take action when expanding a new section
            if ($tab.attr('aria-expanded') === 'false') {
                var section;
                var $tabParent = $tab.parent();

                // update the phone images
                setPhoneScreen($tabParent.find('.media-desktop').html(), $tabParent.prop('id'));

                // if a section is already expanded, collapse it
                for (var i = 0; i < customizeAccordion.sections.length; i++) {
                    section = customizeAccordion.sections[i];

                    if (section.expanded) {
                        section.collapse();
                    }
                }
            }
        });

        // click listener for pager arrows
        $('.customize-pager').on('click', function() {
            var $this = $(this);
            var currentlyExpanded = 0, nextExpanded;

            // find currently expanded section, if any
            for (var i = 0; i < customizeAccordion.sections.length; i++) {
                section = customizeAccordion.sections[i];

                if (section.expanded) {
                    currentlyExpanded = i;
                    break;
                }
            }

            if ($this.prop('id') === 'customize-prev') {
                nextExpanded = (currentlyExpanded === 0) ? customizeAccordion.sections.length - 1 : currentlyExpanded - 1;
            } else {
                nextExpanded = (currentlyExpanded === (customizeAccordion.sections.length - 1)) ? 0 : currentlyExpanded + 1;
            }

            $('#' + customizeAccordion.sections[nextExpanded].id).find('[data-accordion-role="tab"]').trigger('click');
        });
    };

    var initAccordionsMobile = function() {
        // remove desktop bindings
        $('.accordion [data-accordion-role="tab"]').off('click.android-desktop');
        $('.customize-pager').off('click');

        customizeAccordion = new Mozilla.Accordion($('#customize-accordion'));
    };

    // fire sync animation when scrolled to
    $('#sync').waypoint(function() {
        Mozilla.syncAnimation();
    }, {
        triggerOnce: true,
        offset: '50%'
    });

    // if not IE 7 or older, initialize the page
    if (!isOldIE) {
        if (typeof matchMedia !== 'undefined') {
            var queryMobileViewport = matchMedia('(max-width: 760px)');

            // listen for viewport resize
            queryMobileViewport.addListener(function(mq) {
                if (mq.matches) {
                    Mozilla.Accordion.destroyAccordions();
                    stopSlideshow();
                    initAccordionsMobile();
                } else {
                    initAccordionsDesktop();
                }
            });

            if (queryMobileViewport.matches) {
                initAccordionsMobile();
            } else {
                initAccordionsDesktop();
            }
        } else {
            initAccordionsDesktop();
        }
    }

    // document ready stuff
    $(function() {
        // make android guy say hello
        $('#intro-android').addClass('hello');
    });
})(window.jQuery);
