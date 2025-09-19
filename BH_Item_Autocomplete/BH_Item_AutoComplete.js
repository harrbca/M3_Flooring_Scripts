var BH_Item_AutoComplete = class {
    constructor(scriptArgs) {
        this.scriptName = 'BWL_Item_AutoComplete';
        this.language = ScriptUtil.GetUserContext('LANC');
        this.translations = {
            GB: {
                argumentsNoData: 'Missing script arguments, found:',
                fieldNameNoData: 'No value was found for:',
                fieldNameError: 'Field does not exist on panel:',
                unknownError: 'Enter the valid arguments',
            },
        };
        this.cache = {};
        this.cacheSelectedItems = {};
        this.currentSearchTerm = '';
        this.inputElement = '';
        this.controller = scriptArgs.controller;
        this.log = scriptArgs.log;
        this.args = scriptArgs.args;
        this.element = scriptArgs.elem;
    }
    static Init(scriptArgs) {
        if (ScriptUtil.version >= 2.0) {
            new BWL_Item_AutoComplete(scriptArgs).run();
        }
        else {
            console.error(`Wrong H5 version, exiting script...`);
        }
    }
    run() {
        this.log.Info(`Running script: ${this.scriptName}`);
		
  
        const scriptArguments = this.parseArguments(this.args);
        const numberOfArguments = scriptArguments.length;
        if (numberOfArguments < 4) {
            return this.showMessage(`${this.translate('argumentsNoData')} ${numberOfArguments}`, DialogType.Error);
        }
        const [searchField, program, transaction, ...searchCriteria] = scriptArguments;
        let widgetHeight = '400';
        const [lastArgument] = searchCriteria.slice(-1);
        if (this.isNumeric(lastArgument)) {
            widgetHeight = searchCriteria.pop();
            this.log.Debug(`Last argument is a number setting "widgetHeight" to number: ${widgetHeight}`);
        }
        this.log.Debug(`searchField: ${searchField}`);
        this.inputElement = searchField;
        let $searchField = this.controller.GetElement(searchField);
        if ($searchField.length === 0) {
            $searchField = this.getDataGridInputFieldById(searchField);
            if (!$searchField) {
                return;
            }
        }
        console.log('searchfield.......', $searchField);
        let widget = this.setupWidget($searchField, program, transaction, widgetHeight, searchCriteria);
        const unsubscribeRequesting = this.controller.Requesting.On((args) => {
            this.log.Debug(`Event: Requesting, Command type: ${args.commandType}, Command value: ${args.commandValue}`);
            if (args.commandType === 'KEY' && args.commandValue === 'ENTER') {
                const isFocused = this.controller.focusField === searchField;
                const isOpen = widget.menu.element.is(':visible');
                if (isFocused && isOpen) {
                    this.log.Debug(`Canceling ENTER request --> widget menu is open and ${searchField} has focus`);
                    args.cancel = true;
                }
            }
        });
        const unsubscribeRequested = this.controller.Requested.On((args) => {
            if (args.commandType == 'PAGE' && args.commandValue == 'DOWN') {
                setTimeout(() => {
                    $searchField = this.controller.GetElement(this.inputElement);
                    widget = this.setupWidget($searchField, program, transaction, widgetHeight, searchCriteria);
                }, 1000);
            }
            else {
                this.log.Debug(`Event: Requested, Command type: ${args.commandType}, Command value: ${args.commandValue}`);
                unsubscribeRequesting();
                unsubscribeRequested();
                widget.destroy();
            }
        });
    }
    setupWidget(element, program, transaction, widgetHeight, searchCriteria) {
        this.log.Debug(`Initialsing autocomplete on element: ${element}`);
        element.keydown((event) => {
            var _a;
            const isOpen = widget.menu.element.is(':visible');
            if (isOpen) {
                if (event.which === 37 || event.which === 39) {
                    event.stopImmediatePropagation();
                    return widget;
                }
                const currentItem = (_a = widget.menu.active) === null || _a === void 0 ? void 0 : _a.index();
                if (event.which === 38 && currentItem === 0) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return widget;
                }
            }
            if (!isOpen) {
                if (event.which === 38) {
                    event.stopImmediatePropagation();
                    event.preventDefault();
                    return;
                }
            }
        });
        const options = {
            autoFocus: true,
            delay: 300,
            minLength: 1,
            source: (search, response) => {
                this.log.Debug(`source: search: ${search} response: ${response}`);
                const searchTerm = search.term.toUpperCase();
                this.log.Debug(`searchTerm: ${searchTerm}`);
                if (searchTerm in this.cacheSelectedItems) {
                    this.log.Debug(`searchTerm : ${searchTerm} exists in selected items cache return previous result`);
                    return response(this.cache[this.cacheSelectedItems[searchTerm]]);
                }
                if (searchTerm in this.cache) {
                    this.log.Debug(`searchTerm : ${searchTerm} exists in cache returning cached result`);
                    return response(this.cache[searchTerm]);
                }
                this.currentSearchTerm = searchTerm;
                const request = this.createRequest(searchTerm, program, transaction, searchCriteria);
                return MIService.Current.executeRequestV2(request)
                    .then((miResponse) => {
                    if (miResponse.hasError()) {
                        const message = miResponse.errorMessage || this.translate('unknownError');
                        return this.showMessage(message, DialogType.Error);
                    }
                    const parsedResult = this.parseResponse(miResponse);
                    const transformedResult = this.transformResponse(parsedResult);
                    const result = transformedResult;
                    result.sort(this.sortingLogic);
                    this.log.Debug(`Result : ${JSON.stringify(result)}`);
                    this.log.Debug(`Adding searchTerm: ${searchTerm} to cache`);
                    this.cache[searchTerm] = result;
                    return response(result);
                })
                    .catch((err) => {
                    this.showMessage(this.translate('unknownError'), DialogType.Error);
                    return response();
                });
            },
            focus: (event, ui) => {
                return false;
            },
            select: (event, ui) => {
                this.log.Debug(`select: event: ${event} ui: ${ui}`);
                const { label, value } = ui.item;
                this.log.Debug(`Selected item: ${label}${value}`);
                this.cacheSelectedItems[value] = this.currentSearchTerm;
                const elementId = element.attr('id').toUpperCase();
                if (elementId.includes('header-filter') || elementId.includes('ids-data-grid-filter')) {
                    element.val(value);
                }
                else {
                    ScriptUtil.SetFieldValue(elementId, value);
                }
                const isITNO = searchCriteria.find((criteria) => criteria.includes('ITNO'));
                if (isITNO) {
                    this.publishInforBusinessContext(value);
                }
                return false;
            },
        };
        const widget = $.ui.autocomplete(options, element);
        widget.menu.element.css({
            'max-height': `${widgetHeight}px`,
            'overflow-y': 'overlay',
            'overflow-x': 'hidden',
            'font-size': `${this.getFontSizeFromInput()}`,
            'font-family': 'source sans pro",helvetica,arial,sans-serif',
            'z-index': '1000',
            height: 'auto',
            'max-width': '400px',
        });
        return widget;
    }
    getFontSizeFromInput() {
        return this.inputElement ? $(`input#${this.inputElement} `).css('font-size') || '14px' : '14px';
    }
    extendWidget(widget) {
        const getFontSize = () => this.getFontSizeFromInput();
        widget._renderItem = function (ul, item) {
            const html = `
        <div>
            <p style="margin: 0; font-weight: bold;">${item.itno}</p>
            <p style="margin: 0; font-size: 90%;">${item.itds}</p>
        </div>
    `;
            return $('<li>')
                .attr('data-value', item.value)
                .css({ padding: '4px 8px', 'max-width': '400px' })
                .append($(html))
                .appendTo(ul);
        };
        widget.option('position', {
            my: 'left top',
            at: 'left bottom',
            collision: 'flip',
        });
        const Menu = widget.menu;
        const oldActiveClass = 'ui-state-active';
        const newActiveClass = 'is-selected';
        Menu.element.addClass(['listview']);
        Menu._addClass = function (u, v, C) {
            if (C && (C === null || C === void 0 ? void 0 : C.includes(oldActiveClass))) {
                C = C.replace(oldActiveClass, newActiveClass);
                u = this.active || this.element.children().first();
            }
            return this._toggleClass(u, v, C, !0);
        };
        Menu._removeClass = function (u, v, C) {
            if (C && (C === null || C === void 0 ? void 0 : C.includes(oldActiveClass))) {
                C = C.replace(oldActiveClass, newActiveClass);
                u = this.element.children(`.${newActiveClass}`);
            }
            return this._toggleClass(u, v, C, !1);
        };
        return widget;
    }
    publishInforBusinessContext(value) {
        const [program, panel] = this.controller.mainPanelHeader.split('/');
        const CONO = ScriptUtil.GetUserContext('CurrentCompany');
        const DIVI = ScriptUtil.GetUserContext('CurrentDivision');
        const data = {
            screenId: `m3_${program}_${panel}`,
			source: 'BWL Script',
            entities: [
                {
                    accountingEntity: `${CONO}_${DIVI}`,
                    entityType: 'InforItemMaster',
                    id1: value,
                    visible: true,
                    drillbackURL: '',
                },
            ],
        };
        infor.companyon.client.sendMessage(`inforBusinessContext`, data);
    }
    createRequest(searchTerm, program, transaction, searchCriteria) {
        const searchQuery = this.createSearchQuery(searchTerm, searchCriteria);
        const request = new MIRequest();
        request.program = program;
        request.transaction = transaction;
        request.maxReturnedRecords = 100;
        request.outputFields = searchCriteria;
        request.record = {
            SQRY: searchQuery,
        };
        const CONO = ScriptUtil.GetUserContext('CurrentCompany');
        const DIVI = ScriptUtil.GetUserContext('CurrentDivision');
        if (program === 'CMS100MI') {
            return request;
        }
        else if (program === 'MDBREADMI') {
            switch (transaction) {
                case 'LstCMNUSR00-IES':
                    break;
                case 'LstFCHACC00-IES':
                    if (searchCriteria.length === 3) {
                        const [first, second, third] = searchCriteria;
                        const newSearchQuery = this.createSearchQuery(searchTerm, [first, second]);
                        request.record.SQRY = `CONO: ${CONO} DIVI: ${DIVI} AND AITP:${third} AND (${newSearchQuery})`;
                    }
                    else {
                        request.record.SQRY = `CONO: ${CONO} DIVI: ${DIVI} AND AITP:1 AND (${searchQuery})`;
                    }
                    break;
                default:
                    request.record.SQRY = `CONO: ${CONO} AND (${searchQuery})`;
                    break;
            }
            return request;
        }
        else {
            return request;
        }
    }
    getDataGridInputFieldById(id) {
        var _a, _b;
        const grid = this.controller.GetGrid();
        if (!grid) {
            return null;
        }
        const { columns } = grid.h5Data;
        const column = columns.find((column) => {
            if (!column.hasPosField) {
                return false;
            }
            if (column.positionField.name === id) {
                return true;
            }
        });
        if (column) {
            const $input = $(((_b = (_a = grid.getPosFieldElement(id)) === null || _a === void 0 ? void 0 : _a.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector('input')) || grid.getPosFieldElement(id));
            if ($input.length === 0) {
                return null;
            }
            return $input;
        }
        else {
            return null;
        }
    }
    transformSearchCriteria(searchCriteria) {
        return searchCriteria.map((item) => {
            if (item.length > 4) {
                return item.slice(-4);
            }
            return item;
        });
    }
    createSearchQuery(searchTerm, searchCriteria) {
        const [firstCriteria, ...otherCriterias] = this.transformSearchCriteria(searchCriteria);
        let query = `(${firstCriteria}: *${searchTerm}*)`;
        for (const criteria of otherCriterias) {
            query += ` OR (${criteria}: *${searchTerm}*)`;
        }
        return query;
    }
    parseResponse(response) {
        const { items } = response;
        if ((items === null || items === void 0 ? void 0 : items.length) === 0) {
            return [];
        }
        return items;
    }
    transformResponse(response) {
        return response.map((record) => {
            const itemNumber = record.ITNO || '';
            const description = record.ITDS || '';
            return {
                label: `${itemNumber} --- ${description}`,
                value: itemNumber,
                itno: itemNumber,
                itds: description
            };
        });
    }
    filterSearch(searchTerm, result) {
        let searchValue = searchTerm;
        if (searchTerm.startsWith('*')) {
            searchValue = searchTerm.substr(1);
        }
        return result.filter((item) => {
            const { value, label } = item;
            this.log.Debug(`value: ${value} label: ${label}`);
            if (value.toUpperCase().includes(searchValue)) {
                return true;
            }
            else if (label.toUpperCase().includes(searchValue)) {
                return true;
            }
            else {
                return false;
            }
        });
    }
    sortingLogic(a, b) {
        if (a.value > b.value) {
            return 1;
        }
        if (a.value < b.value) {
            return -1;
        }
        return 0;
    }
    isNumeric(num) {
        return !isNaN(Number(num));
    }
    showMessage(message, dialogType) {
        const options = {
            header: this.scriptName,
            message: message,
            dialogType: dialogType,
            id: `${this.scriptName}`,
        };
        ConfirmDialog.ShowMessageDialog(options);
    }
    translate(translation) {
        const language = this.translations[this.language] || this.translations[`GB`];
        return language[translation] || 'No translation found!';
    }
    parseArguments(scriptArguments) {
        return scriptArguments.split(`,`).map((argument) => argument.trim());
    }
};
var DialogType;
(function (DialogType) {
    DialogType["Question"] = "Question";
    DialogType["Information"] = "Information";
    DialogType["Warning"] = "Warning";
    DialogType["Error"] = "Error";
})(DialogType || (DialogType = {}));
