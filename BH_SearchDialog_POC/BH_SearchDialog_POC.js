/* BH_SearchDialog_POC.js (rev4: scroll + reliable open)
 * - Scrolls inside a fixed-height grid (no paging)
 * - Opens on first click (waits for modal init)
 */

var BH_SearchDialog_POC = /** @class */ (function () {
  function BH_SearchDialog_POC(scriptArgs) {
    this.controller = scriptArgs.controller;
    this.args = scriptArgs.args;
    this.log = scriptArgs.log;

    this.searchButtonId = "bh-search-trigger";
    this.dialogId = "bh-search-dialog";
    this.searchInputId = "bh-search-input";
    this.gridContainerId = "bh-search-grid";
  }

  BH_SearchDialog_POC.prototype.run = function () {
    try {
      this.addSearchButtonNearField("MMITDS");
    } catch (error) {
      (this.log || console).error("[BH_SearchDialog_POC] run() error:", error);
    }
  };

  BH_SearchDialog_POC.prototype.addSearchButtonNearField = function (fieldId) {
    var $panelRoot = this.getPanelRoot();
    var $targetField = $panelRoot.find('input#' + fieldId).first();
    if ($targetField.length === 0) {
      (this.log || console).warn("[BH_SearchDialog_POC] Field not found:", fieldId);
      return;
    }
    if ($panelRoot.find("#" + this.searchButtonId).length > 0) return;

    var $button = $('<button>', {
      id: this.searchButtonId,
      type: "button",
      class: "btn-secondary",
      text: "Search…",
      title: "Open item search"
    }).css({ marginLeft: "8px" });

    $targetField.after($button);
    $button.on("click", this.openSearchDialog.bind(this));
  };

  BH_SearchDialog_POC.prototype.openSearchDialog = function () {
    var self = this;
    var $existingDialog = $("#" + this.dialogId);
    if ($existingDialog.length) {
      var existingApi = $existingDialog.data("modal");
      if (existingApi && existingApi.open) existingApi.open();
      return;
    }

    // Fixed-height body so dialog doesn't jump; grid gets the scroll.
    var $dialog = $(
      '<div id="' + this.dialogId + '" class="modal" role="dialog" aria-modal="true">' +
        '<div class="modal-content" style="width: 800px; max-width: 90vw;">' +
          '<div class="modal-header">' +
            '<h1 class="modal-title">Find Items</h1>' +
          '</div>' +
          '<div class="modal-body" style="height: 520px; overflow: hidden;">' +
            '<label for="' + this.searchInputId + '" class="audible">Search</label>' +
            '<input id="' + this.searchInputId + '" class="searchfield" placeholder="Search…">' +
            // Grid container with fixed height; datagrid handles internal scroll.
            '<div id="' + this.gridContainerId + '" style="margin-top: 12px; height: 440px;"></div>' +
          '</div>' +
          '<div class="modal-footer">' +
            '<button type="button" class="btn-modal-primary btn-close-dialog">Close</button>' +
          '</div>' +
        '</div>' +
      '</div>'
    ).appendTo("body");

    // Initialize modal + open immediately
    if (typeof $dialog.modal === "function") {
      $dialog.modal();
      var api = $dialog.data("modal");
      if (api && api.open) api.open();
    }

    // Close button (works whether modal plugin is present or not)
    $dialog.find(".btn-close-dialog").on("click", function () {
      var modalApi = $dialog.data("modal");
      if (modalApi && modalApi.close) modalApi.close();
      else $dialog.remove();
    });

    // Initialize searchfield if available
    var $search = $("#" + this.searchInputId);
    if (typeof $search.searchfield === "function") $search.searchfield();

    var initGrid = function () {
      var $grid = $("#" + self.gridContainerId);
      var gridOptions = {
        selectable: "single",
        paging: false,               // <-- scroll instead of paging
        rowHeight: "short",
        stretchColumn: "NAME",
        columns: [
          { id: "ITNO",  name: "Item",  field: "ITNO",  width: 140 },
          { id: "NAME",  name: "Name",  field: "NAME",  width: 360 },
          { id: "UOM",   name: "UOM",   field: "UOM",   width: 80  },
          { id: "PRICE", name: "Price", field: "PRICE", width: 100, align: "right", formatter: self.priceFormatter }
        ],
        dataset: self.getDemoDataset()  // load initially
      };

      if (typeof $grid.datagrid === "function") {
        $grid.datagrid(gridOptions);
      } else {
        // Fallback simple table if plugin missing
        $grid.empty().append(self.buildFallbackTable(gridOptions.dataset));
      }

      // Debounced filter of demo data
      var debouncedHandler = self.debounce(function () {
        var queryText = $search.val().trim().toLowerCase();
        var allRows = self.getDemoDataset();
        var filteredRows = allRows.filter(function (row) {
          return (
            String(row.ITNO).toLowerCase().indexOf(queryText) >= 0 ||
            String(row.NAME).toLowerCase().indexOf(queryText) >= 0
          );
        });

        if (typeof $grid.datagrid === "function") {
          var api = $grid.data("datagrid");
          if (api && api.loadData) {
            api.loadData(filteredRows);
          } else {
            $grid.datagrid({ dataset: filteredRows });
          }
        } else {
          $grid.empty().append(self.buildFallbackTable(filteredRows));
        }
      }, 200);

      $search.off("input.bhDemo").on("input.bhDemo", debouncedHandler);

      // Optional: dbl-click to log
      $grid.off("rowactivated.bhDemo").on("rowactivated.bhDemo", function (_e, args) {
        var selectedRow = args && args.item ? args.item : null;
        if (selectedRow) console.log("[BH_SearchDialog_POC] Selected row:", selectedRow);
      });
    };

    // Initialize the grid AFTER the modal has opened so sizes are correct
    var modalApi = $dialog.data("modal");
    if (modalApi && typeof $dialog.one === "function") {
      $dialog.one("afteropen", initGrid);
    } else {
      // Fallback: run next tick if event not available
      setTimeout(initGrid, 0);
    }
  };

  // --- Helpers / Utilities

  BH_SearchDialog_POC.prototype.priceFormatter = function (_row, _cell, value) {
    if (value == null || value === "") return "";
    var n = parseFloat(value);
    return isNaN(n) ? "" : n.toFixed(2);
  };

  BH_SearchDialog_POC.prototype.getPanelRoot = function () {
    if (this.controller && typeof this.controller.getPanelNode === "function") {
      var node = this.controller.getPanelNode();
      if (node && node.jquery) return node;
      if (node) return $(node);
    }
    if (this.controller && this.controller.ParentWindow) return this.controller.ParentWindow;
    if (this.controller && this.controller.element) return $(this.controller.element);
    return $(document);
  };

  BH_SearchDialog_POC.prototype.debounce = function (callback, waitMilliseconds) {
    var timeoutHandle = null;
    return function () {
      var context = this, args = arguments;
      if (timeoutHandle) clearTimeout(timeoutHandle);
      timeoutHandle = setTimeout(function () {
        callback.apply(context, args);
      }, waitMilliseconds);
    };
  };

  // Fallback plain table if datagrid plugin is unavailable
  BH_SearchDialog_POC.prototype.buildFallbackTable = function (rows) {
    var $wrap = $('<div style="height: 440px; overflow:auto;"></div>');
    var $table = $('<table class="datagrid"><thead><tr>' +
      '<th>Item</th><th>Name</th><th>UOM</th><th style="text-align:right;">Price</th>' +
      '</tr></thead><tbody></tbody></table>').css({ width: "100%" });
    var $tbody = $table.find("tbody");
    rows.forEach(function (r) {
      $('<tr><td>' + (r.ITNO||'') + '</td><td>' + (r.NAME||'') + '</td><td>' + (r.UOM||'') + '</td><td style="text-align:right;">' + (r.PRICE||'') + '</td></tr>').appendTo($tbody);
    });
    $wrap.append($table);
    return $wrap;
  };

  // Demo data
  BH_SearchDialog_POC.prototype.getDemoDataset = function () {
    return [
      { ITNO: "A100-01", NAME: "Alpine Oak 6\" Plank", UOM: "CT", PRICE: 59.95 },
      { ITNO: "A100-02", NAME: "Alpine Oak 8\" Plank", UOM: "CT", PRICE: 64.50 },
      { ITNO: "B205-11", NAME: "Basalt Tile 12x12",    UOM: "CT", PRICE: 41.20 },
      { ITNO: "B205-12", NAME: "Basalt Tile 24x24",    UOM: "CT", PRICE: 72.00 },
      { ITNO: "C330-05", NAME: "Carbon Carpet Tile",   UOM: "BX", PRICE: 88.10 },
      { ITNO: "C330-06", NAME: "Carbon Carpet Broad",  UOM: "SY", PRICE: 17.95 },
      { ITNO: "D410-77", NAME: "Delta Underlayment",   UOM: "RL", PRICE: 24.99 },
      { ITNO: "E515-03", NAME: "Edge Trim Brushed",    UOM: "EA", PRICE:  9.50 },
      { ITNO: "F620-10", NAME: "Fjord Vinyl Sheet",    UOM: "SY", PRICE: 13.25 },
      { ITNO: "G710-08", NAME: "Granite Grout 8lb",    UOM: "EA", PRICE: 12.99 },
      { ITNO: "H840-22", NAME: "Hickory T-Mould",      UOM: "EA", PRICE: 15.75 },
      { ITNO: "J950-90", NAME: "Jet Black Stair Nosing", UOM: "EA", PRICE: 19.25 },
  { ITNO: "A100-01", NAME: "Alpine Oak 6\" Plank", UOM: "CT", PRICE: 59.95 },
  { ITNO: "A100-02", NAME: "Alpine Oak 8\" Plank", UOM: "CT", PRICE: 64.50 },
  { ITNO: "B205-11", NAME: "Basalt Tile 12x12",    UOM: "CT", PRICE: 41.20 },
  { ITNO: "B205-12", NAME: "Basalt Tile 24x24",    UOM: "CT", PRICE: 72.00 },
  { ITNO: "C330-05", NAME: "Carbon Carpet Tile",   UOM: "BX", PRICE: 88.10 },
  { ITNO: "C330-06", NAME: "Carbon Carpet Broad",  UOM: "SY", PRICE: 17.95 },
  { ITNO: "D410-77", NAME: "Delta Underlayment",   UOM: "RL", PRICE: 24.99 },
  { ITNO: "E515-03", NAME: "Edge Trim Brushed",    UOM: "EA", PRICE:  9.50 },
  { ITNO: "F620-10", NAME: "Fjord Vinyl Sheet",    UOM: "SY", PRICE: 13.25 },
  { ITNO: "G710-08", NAME: "Granite Grout 8lb",    UOM: "EA", PRICE: 12.99 },
  { ITNO: "H840-22", NAME: "Hickory T-Mould",      UOM: "EA", PRICE: 15.75 },
  { ITNO: "J950-90", NAME: "Jet Black Stair Nosing", UOM: "EA", PRICE: 19.25 },

  { ITNO: "K101-01", NAME: "Khaki Vinyl Plank 6x48", UOM: "CT", PRICE: 45.30 },
  { ITNO: "K101-02", NAME: "Khaki Vinyl Plank 7x48", UOM: "CT", PRICE: 49.99 },
  { ITNO: "L202-15", NAME: "Limestone Tile 12x24",  UOM: "CT", PRICE: 55.00 },
  { ITNO: "L202-16", NAME: "Limestone Tile 18x18",  UOM: "CT", PRICE: 62.25 },
  { ITNO: "M303-07", NAME: "Maple Hardwood Strip",  UOM: "SF", PRICE: 7.95 },
  { ITNO: "M303-08", NAME: "Maple Hardwood Plank",  UOM: "SF", PRICE: 9.25 },
  { ITNO: "N404-12", NAME: "Neutral Carpet Beige",  UOM: "SY", PRICE: 21.75 },
  { ITNO: "N404-13", NAME: "Neutral Carpet Grey",   UOM: "SY", PRICE: 22.40 },
  { ITNO: "O505-20", NAME: "Onyx Mosaic 2x2",       UOM: "CT", PRICE: 98.00 },
  { ITNO: "O505-21", NAME: "Onyx Mosaic 4x4",       UOM: "CT", PRICE: 102.50 },
  { ITNO: "P606-30", NAME: "Pine Laminate Board",   UOM: "CT", PRICE: 39.99 },
  { ITNO: "P606-31", NAME: "Pine Laminate Wide",    UOM: "CT", PRICE: 44.75 },
  { ITNO: "Q707-40", NAME: "Quartz Counter Slab",   UOM: "EA", PRICE: 249.00 },
  { ITNO: "Q707-41", NAME: "Quartz Remnant 36\"",   UOM: "EA", PRICE: 99.00 },
  { ITNO: "R808-50", NAME: "Red Oak Stair Tread",   UOM: "EA", PRICE: 29.50 },
  { ITNO: "R808-51", NAME: "Red Oak Riser",         UOM: "EA", PRICE: 19.00 },
  { ITNO: "S909-60", NAME: "Slate Tile 16x16",      UOM: "CT", PRICE: 65.00 },
  { ITNO: "S909-61", NAME: "Slate Tile 24x24",      UOM: "CT", PRICE: 78.50 },
  { ITNO: "T010-70", NAME: "Travertine Tile 12x12", UOM: "CT", PRICE: 54.20 },
  { ITNO: "T010-71", NAME: "Travertine Tile 18x18", UOM: "CT", PRICE: 66.10 },
  { ITNO: "U111-80", NAME: "Underpad Foam Roll",    UOM: "RL", PRICE: 32.00 },
  { ITNO: "U111-81", NAME: "Underpad Felt Roll",    UOM: "RL", PRICE: 27.50 },
  { ITNO: "V212-90", NAME: "Vinyl Tile White",      UOM: "CT", PRICE: 24.99 },
  { ITNO: "V212-91", NAME: "Vinyl Tile Black",      UOM: "CT", PRICE: 24.99 },
  { ITNO: "W313-95", NAME: "Walnut Hardwood Wide",  UOM: "SF", PRICE: 11.25 },
  { ITNO: "W313-96", NAME: "Walnut Hardwood Strip", UOM: "SF", PRICE: 9.75 },
  { ITNO: "X414-01", NAME: "Xenon Glass Tile 3x6",  UOM: "CT", PRICE: 88.00 },
  { ITNO: "X414-02", NAME: "Xenon Glass Tile 6x6",  UOM: "CT", PRICE: 92.50 },
  { ITNO: "Y515-10", NAME: "Yellow Pine Plywood",   UOM: "EA", PRICE: 45.00 },
  { ITNO: "Y515-11", NAME: "Yellow Pine OSB",       UOM: "EA", PRICE: 32.00 },
  { ITNO: "Z616-20", NAME: "Zebrawood Veneer Sheet",UOM: "EA", PRICE: 120.00 },
  { ITNO: "Z616-21", NAME: "Zebrawood Veneer Roll", UOM: "RL", PRICE: 210.00 }
    ]
  };

  BH_SearchDialog_POC.Init = function (scriptArgs) {
    new BH_SearchDialog_POC(scriptArgs).run();
  };

  return BH_SearchDialog_POC;
}());



