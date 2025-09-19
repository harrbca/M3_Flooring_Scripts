

(function(){
    "use strict";

    // Global registry shared by all BH_Uppercase instances in this window/session
    var GLOBAL_KEY = "__BH_UPPERCASE_GLOBAL__";
    if (!window[GLOBAL_KEY]) {
        window[GLOBAL_KEY] = {
            listenerInstalled: false,
            allowedFieldIdMap: Object.create(null),
            isComposing: false
        };
    }
    var globalState = window[GLOBAL_KEY];

    var BH_Uppercase = /** @class */ (function () {
        function BH_Uppercase(scriptArgs) {
            this.controller = scriptArgs.controller;
            this.args = scriptArgs.args;
            this.log = scriptArgs.log;

            this.defaultsByProgram = {
                "MMS001": ["MMITDS", "MMFUDS"],
                "OIS101": ["OBALUN", "OBSPUN"],
                "CRS610": ["WRCUNM", "WRCUA1", "WRCUA2", "WRCUA3", "WRCUA4"],
            };
        }

        // Always parse a comma-separated string
        BH_Uppercase.prototype.normalizeArgList = function (rawArgs) {
            if (!rawArgs) return [];
            return String(rawArgs)
                .split(",")
                .map(function (s) { return s.trim(); })
                .filter(Boolean);
        };

        // Extract the program name from the main panel header
        // main panel header appeaars as "MMS001/E"
        BH_Uppercase.prototype.getProgramName = function () {
            const header = this.controller?.mainPanelHeader || "";
            const m = header.match(/[A-Z]{3}\d{3}/); // OIS101, MMS001, CRS610, etc.
            return m ? m[0] : null;
        }


        /**
         * Ensure the global delegated listener is installed at document level.
         * Accumulates new field IDs into the global allow-list.
         */
        BH_Uppercase.prototype.installOrUpdateGlobalDelegatedUppercase = function (targetFieldIds) {
            if (Array.isArray(targetFieldIds)) {
                for (var i = 0; i < targetFieldIds.length; i++) {
                    var fieldId = String(targetFieldIds[i]).trim();
                    if (fieldId.length > 0) {
                        globalState.allowedFieldIdMap[fieldId] = true;
                    }
                }
            }

            if (globalState.listenerInstalled) return; // already bound once

            var compositionStartHandler = function () { globalState.isComposing = true; };
            var compositionEndHandler   = function () { globalState.isComposing = false; };

            var inputHandler = function (event) {
                var targetElement = event && event.target ? event.target : null;
                if (!targetElement || targetElement.tagName !== "INPUT") return;
                var fieldId = targetElement.id;
                if (!fieldId || globalState.allowedFieldIdMap[fieldId] !== true) return;
                if (globalState.isComposing) return;

                var currentValue = targetElement.value || "";
                var uppercasedValue = currentValue.toUpperCase();
                if (currentValue !== uppercasedValue) {
                    var selectionStart = targetElement.selectionStart;
                    var selectionEnd = targetElement.selectionEnd;
                    targetElement.value = uppercasedValue;
                    if (selectionStart != null && selectionEnd != null) {
                        try { targetElement.setSelectionRange(selectionStart, selectionEnd); } catch (e) {}
                    }
                }
            };

            // Bind globally at document level (capture) to handle all tabs/panels
            document.addEventListener("compositionstart", compositionStartHandler, true);
            document.addEventListener("compositionend",   compositionEndHandler,   true);
            document.addEventListener("input",            inputHandler,            true);

            globalState.listenerInstalled = true;
        };

        BH_Uppercase.prototype.run = function () {
            try {

                var program = this.getProgramName();
                if (!program) {
                    this.log.Error("No program name found; aborting.");
                    return;
                }

                var defaultFields = [];

                var argList = this.normalizeArgList(this.args);

                var extrasStartIndex = 0;
                var useDefaults = true;

                // if the first argument is a program name found in the defaults list, use it
                if (argList[0] && this.defaultsByProgram[argList[0]]) {
                    program = argList[0].toUpperCase();
                    extrasStartIndex++;
                }

                defaultFields = this.defaultsByProgram[program].slice();

                if (argList[extrasStartIndex] && argList[extrasStartIndex].toUpperCase() === "NO_DEFAULTS") {
                    useDefaults = false;
                    extrasStartIndex++;
                }

                var finalFields = [];
                var seenSet = new Set();

                if (useDefaults) {
                    defaultFields.forEach(function (fieldId) {
                        var clean = String(fieldId).trim();
                        if (clean && !seenSet[clean]) {
                                seenSet[clean] = true;
                                finalFields.push(clean);
                            }
                    });
                }

                for (var i = extrasStartIndex; i < argList.length; i++) {
                    var extraId = String(argList[i]).trim().toUpperCase();
                    if (extraId && !seenSet[extraId]) {
                        seenSet[extraId] = true;
                        finalFields.push(extraId);
                    }
                }

                this.log.Info("Program:", program);
                this.log.Info("Default fields:", useDefaults ? defaultFields : "(none)");
                this.log.Info("Args:", argList);
                this.log.Info("Final fields:", finalFields);


                // Install once globally and merge these field IDs into the allow-list
                this.installOrUpdateGlobalDelegatedUppercase(finalFields);
            } catch (e) {
                this.log.Error("Error:", e);
            }
        };

        BH_Uppercase.Init = function (scriptArgs) {
            new BH_Uppercase(scriptArgs).run();
        };

        return BH_Uppercase;
    }());

    // Expose to global (in case the loader expects it)
    window.BH_Uppercase = BH_Uppercase;
})();
