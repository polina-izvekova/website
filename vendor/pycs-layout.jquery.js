/*!
 * Pycs-Layout jQuery Plugin
 * @author: Antoine de Monte
 *
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 *
 * This plugin optimizes the layout of pictures inside a container
 * by adjusting their sizes while maintaining aspect ratios.
 *
 * Based on Johannes Treitz's algorithm:
 * http://www.crispymtn.com/stories/the-algorithm-for-a-perfectly-balanced-photo-gallery
 */

(function ($) {
  // Main plugin function definition
  $.fn.pycsLayout = function (options) {
    // Default settings, allowing user customization
    var settings = $.extend({
      pictureContainer: ".picture", // CSS selector for items to layout
      idealHeight: 150, // Target height for items
      gutter: 6, // Margin between items (in pixels)
    }, options);

    // Function to compute and apply layout for a given container width and its items
    var chromatic = function (containerWidth, items) {
      /**
       * Helper function to create a 2D array initialized with zeros.
       * Used for dynamic programming in the linear partition algorithm.
       */
      var zero_tab = function (n, k) {
        var table = [];
        for (var i = 0; i < n; i++) {
          table[i] = [];
          for (var j = 0; j < k; j++) {
            table[i][j] = 0;
          }
        }
        return table;
      };

      /**
       * Linear partition algorithm to divide a sequence of weights (aspect ratios)
       * into k contiguous groups with optimized distribution.
       */
      var linear_partition = function (seq, k) {
        n = seq.length;

        // Handle edge cases where group count is invalid or exceeds item count
        if (k <= 0) return [];
        if (k > n) return seq.map(function (x) { return [x]; });

        // Initialize tables for cumulative sums and backtracking solutions
        var table = zero_tab(n, k);
        var solution = zero_tab(n, k);

        // Fill base cases for the first row and column
        for (var i = 0; i < n; i++) {
          table[i][0] = seq[i];
          if (i > 0) table[i][0] += table[i - 1][0]; // Cumulative sum for the first column
        }
        for (var j = 0; j < k; j++) table[0][j] = seq[0];

        // Populate tables using dynamic programming
        for (var i = 1; i < n; i++) {
          for (var j = 1; j < k; j++) {
            var m = [Math.max(table[0][j - 1], table[i][0] - table[0][0])];
            m.push(0);

            for (var x = 0; x < i; x++) {
              var max = Math.max(table[x][j - 1], table[i][0] - table[x][0]);
              if (max < m[0]) m = [max, x];
            }

            table[i][j] = m[0]; // Optimal value
            solution[i - 1][j - 1] = m[1]; // Backtrack pointer
          }
        }

        // Backtrack through the solution table to reconstruct the partitions
        n -= 1;
        k -= 2;
        var ans = [];
        while (k >= 0) {
          var p = [];
          if (n > 0) {
            for (var i = solution[n - 1][k] + 1; i < n + 1; i++) {
              p.push(seq[i]);
            }
            ans = [p].concat(ans);
            n = solution[n - 1][k];
          }
          k -= 1;
        }
        var p = [];
        for (var i = 0; i < n + 1; i++) p.push(seq[i]);
        return [p].concat(ans);
      };

      /**
       * Compute aspect ratios for each item and set corresponding data attributes.
       * Adjusts the widths to match the ideal height while preserving aspect ratios.
       */
      var get_aspect_ratios = function (items) {
        // Calculate ideal height based on screen orientation
        var idealHeight = Math.round(window.outerHeight > window.outerWidth ? 
                                     (window.outerHeight / 2) : 
                                     (window.outerHeight / 2.5));
        var aspect_ratios = [];

        for (var i = 0; i < items.length; i++) {
          var width = parseInt($(items[i]).attr("data-pycs-width"));
          var height = parseInt($(items[i]).attr("data-pycs-height"));
          var ar = width / height; // Aspect ratio
          var new_width = ar * idealHeight;

          // Set calculated attributes on the item
          $(items[i]).attr("data-pycs-vwidth", new_width);
          $(items[i]).attr("data-pycs-vheight", idealHeight);
          $(items[i]).attr("data-pycs-aspect-ratio", Math.round(ar * 100) / 100);
          aspect_ratios.push(parseInt(ar * 100));
        }
        return aspect_ratios;
      };

      // Calculate total width required for all items
      var totalWidth = 0;
      var weights = get_aspect_ratios(items); // Aspect ratios as weights
      var rows_number = 0;
      var rows = [];

      var horisontalGutterEnabled = window.matchMedia("(min-width: 480px)").matches;

      for (var i = 0; i < items.length; i++) {
        totalWidth += (parseInt($(items[i]).attr("data-pycs-vwidth")) + (horisontalGutterEnabled ? settings.gutter : 0));
      }

      // Determine the number of rows based on container width
      rows_number = Math.round(totalWidth / containerWidth);

      // Partition the weights into rows
      var partition = rows_number === 0 ? [weights] : linear_partition(weights, rows_number);

      // Construct rows and adjust item dimensions
      var index = 0;
      for (var i = 0; i < partition.length; i++) {
        rows[i] = [];
        var summed_ratios = 0;

        // Sum aspect ratios for the row
        for (var j = 0; j < partition[i].length; j++) {
          summed_ratios += parseFloat($(items[index]).attr("data-pycs-aspect-ratio"));
          rows[i][j] = items[index];
          index++;
        }

        // Adjust item dimensions proportionally for the row
        for (var j = 0; j < rows[i].length; j++) {
          var vwidth = containerWidth / summed_ratios;
          vwidth *= parseFloat($(rows[i][j]).attr("data-pycs-aspect-ratio"));
          vwidth = parseInt(vwidth) - (horisontalGutterEnabled ? settings.gutter : 0); // Adjust for gutter
          var vheight = parseInt(((containerWidth - rows[i].length * settings.gutter) / summed_ratios));
          $(rows[i][j]).attr("data-pycs-vwidth", vwidth);
          $(rows[i][j]).attr("data-pycs-vheight", vheight);
        }
      }

      return rows; // Return the computed row structure
    };

    /**
     * Function to apply styles and layout to images based on computed rows.
     */
    var showImages = function (imageContainer, realItems) {
      var containerWidth = imageContainer.width();
      var items = realItems;
      var rows = null;

      imageContainer.attr("data-layout-width-at-calculation", containerWidth);

      // Save original item dimensions to handle resize events
      if (imageContainer.attr("data-pycs-done") !== "true") {
        for (var i = 0; i < items.length; i++) {
          var $item = $(items[i]);
          var hasWidth = $item.attr("data-pycs-width");
          var width = hasWidth || parseInt($item.width());
          var height = $item.attr("data-pycs-height") || parseInt($item.height());
          if (!hasWidth) {
            $item.attr("data-pycs-width", width);
            $item.attr("data-pycs-height", height);
          }
        }
      }

      // Compute rows using the chromatic function
      rows = chromatic(containerWidth, items);

      // Apply calculated styles to each item
      for (var r in rows) {
        for (var i in rows[r]) {
          var item = rows[r][i];
          $(item).css({
            // margin: Math.floor(settings.gutter / 2) + "px",
            width: $(item).attr("data-pycs-vwidth") + "px",
            height: $(item).attr("data-pycs-vheight") + "px",
          });
        }
      }

      // Mark container as processed
      imageContainer.attr("data-pycs-done", "true");
    };

    var $this = $(this);

    // Apply layout to each container in the selection
    if ($this.length > 0) {
      var callShowImages = function() {
        $this.each(function () {
          var that = $(this);
          showImages(that, $(settings.pictureContainer, that));
        });
      }

      callShowImages();

      // Debounce resize event to reapply layout
      let resizeTimer;

      function handleResize() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(callShowImages, 200);
      }

      // Attach resize event listener
      window.addEventListener("resize", handleResize);

      // Watchdog function to account for sudden scrollbar appearance or disappearance
      // Prevent changes in scrollbar visibility from disrupting the pycsLayout layout
      var watchdogTask = function () {
        $this.each(function () {
          var that = $(this);
          var attrValue = that.attr("data-layout-width-at-calculation");
          if (attrValue && attrValue != that.width()) {
            showImages(that, $(settings.pictureContainer, that));
          }
        });
     }
      setInterval(watchdogTask, 6000);
    }

    return $this; // Enable jQuery chaining
  };
})(jQuery);
