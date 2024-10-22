(function( zzoommOrderJourney, $, undefined ) {
		
/* Go!
---------------------------------------*/

var _checkoutForm;
var _bookingCalendar;

$(function () 
{	
	_checkoutForm = $('#zz-order-journey-form');
	
	if (_checkoutForm.length) {
        initCheckout();
    }
	
	_bookingCalendar = $('#zz-booking-calendar');
	
	if (_bookingCalendar.length) {
        initCalendar();
    }
	
	var productSelection = $('#zz-product-selection');

	if (productSelection.length) {
        initProductSelection();
    }
	
	initAddressSearch();
	initRegisterContactForm();
	initSurveys();
	initInputs();
	initTracking();
	initOneTouchSwitch();
	
	// Mouseover effects
	
	var mouseovers = $('.zz-mouseover');

	mouseovers.bind('mouseenter', function () {
		$(this).addClass('zz--over');
	});
	
	mouseovers.bind('mouseleave', function () {
		$(this).removeClass('zz--over');
	});
	
	// Products
	
	// $('.zz-showcase').bind('click', function(){
	// 	var link = $(this).data('link');
	// 	document.location.href= link;
	// });
	
	$('.zz-showcase__footnote').matchHeight();
	
	// Terms
	
	$('.zz-terms--embedded a').click(function(){
		var href = $(this).attr('href');
		window.open(href);
		return false;
	});
	
	$('.zz-checkout-terms-trigger').click(function (){
		var wrapper = $('#zz-checkout-terms-wrapper');
	
		if (wrapper.length) {

			if (wrapper.is(':visible')) {
				wrapper.hide();
			} else {
				wrapper.show();
				scrollToElement(wrapper);
			}
			
		}
		
		return false;
	});
	
	//
	
	$('.zz-restart-confirm').click(function(){
		return confirm('Are you sure? You\'ll have to restart your order from the beginning.');
	});
	
	var sidebarHeight = $('#zz-sidebar').outerHeight();
	
	$('#zz-journey-wrapper').css('min-height', sidebarHeight + 'px');
});

/* CookieBot
---------------------------------------*/

if (typeof Cookiebot != 'undefined') {
	var doNotTrack = $('body').hasClass('zz-do-not-track');
		
	if (doNotTrack) {
		Cookiebot.withdraw();
		Cookiebot.hide();
	}
}

/* Address Search
---------------------------------------*/

var _addressSelectElement;
var _addressResultsWrapper;

var _addressSearchResults;
var _addressSearchPage;

var _addressesLoading;
var _addressProductLineSelect;
var _addressProductLineInput;

function initAddressSearch() {
	
	initFormAddressSearches();
	
    if ($('#zz-postcoder-search').length) {
        initAddressSearchForm();
    }

	$('#zz-postcoder-confirm').click(function() {
		toggleSpinner(true);
		
		var form = $('#zz-postcoder-form');
		var postcode = $('#zz-postcoder-input-postcode').val();
		var productLine = $('#zz-postcoder-product-line').val();
		var action = null;
		
		trackEligiblePostcodeEvent(postcode, productLine, action, function() {
			form.submit();
		});
				
        return false;
    });

	$('.zz-postcoder-help').click(function(){
		if (typeof window.fcWidget != 'undefined') {
			window.fcWidget.open();
		} else {
			window.open('/contact');
		}
	
		return false;
	});
	
	_addressProductLineSelect = $('#zz-postcoder-product-line');
    _addressProductLineInput = $('#zz-postcoder-product-line-input');
	
	_addressProductLineSelect.change(function() {
        _addressProductLineInput.val($(this).val());
    });
};

function initAddressSearchForm() {
   
    _addressSelectElement = $('#zz-postcoder-address');
    _addressResultsWrapper = $('#zz-postcoder-results');

    $('#zz-postcoder-submit').click(function() {
        submitAddressSearchForm();
        return false;
    });

    $('#zz-postcoder-new-search').click(function() {
		$('.zz-postcoder-hidden').hide();
        $('.zz-postcoder-has-addresses').removeClass('zz-postcoder-has-addresses');
        $('#zz-postcoder-partial-address').val('');
        $('#zz-postcoder-partial-address').focus();
        return false;
    });
	
	$('#zz-postcoder-partial-address').keydown(function(e){
		
		if(e.which == 13){
			submitAddressSearchForm();
			return false;
		}
	})
	
    _addressSelectElement.change(onAddressSelectChange);
    
    var preloadedAddresses = zzPostcodeAddressData;
	
    if (preloadedAddresses && preloadedAddresses.data) {
        _addressSearchResults = preloadedAddresses.data;
        showAddressSearchResults();
    } else {
		$('.zz-postcoder-has-addresses').removeClass('zz-postcoder-has-addresses');
	}
}

function submitAddressSearchForm()
{
	var address = getSearchAddress();
	
	if (address.length >= 3) {
		_addressSearchPage = 0;
		trackPostcodeCheckEvent(address);
		submitAddressSearch();
	}
}

function submitAddressSearch() {
	$('.zz-postcoder-hidden').hide();
	
    addressApiSearch( getSearchAddress(), _addressSearchPage );
}

function addressApiSearch( address, page, callback ) {

    if (_addressesLoading) {
        return false;
    }

    if (!address.length) {
        return false
    }

    submitAddressSearchRequest(address, page, onAddressSearchComplete);
}

function submitAddressSearchRequest(address, page, callback)
{
    _addressesLoading = true;

    $.ajax({
        type: 'POST',
        url: '/wp-json/zzoomm/v1/addresses/search',
        dataType: 'json',
        data: { address: address, page: page, path: window.location.pathname },
        complete: function(response){
            _addressesLoading = false;
            callback(response.responseJSON);
        }
    });
	
	toggleSpinner(true);
}

function onAddressSearchComplete(json)
{
    if (!json['success']) {
        alert('An error occurred. Please try again shortly.');
        return;
    }

    _addressSearchResults = json.data;

    showAddressSearchResults();
	toggleSpinner(false);
}

function showAddressSearchResults() {
    _addressSelectElement.empty();

    addSearchSelectOption('null', 'Select an address');

    var addresses = _addressSearchResults;

    if (addresses && addresses.length) {
        for (var a in addresses) {
            var address = addresses[a];
            addSearchSelectOption(a, address['summaryline']);

            if (address['morevalues'] == 'true') {
                addSearchSelectOption('more', 'Load more addresses...');
            }
        }

        _addressResultsWrapper.show();
    } else {
        $('#zz-postcoder-no-results').fadeIn();
    }
}

function addSearchSelectOption(key, value) {
    _addressSelectElement.append('<option value="' + key + '">' + value + '</option>');
}

function onAddressSelectChange() {
    var selected = _addressSelectElement.val();

    if ( typeof _addressSearchResults[selected] != 'undefined' ) {
        showAddressSearchConfirmation(_addressSearchResults[selected]);
    } else if ('more' == selected){
        _addressSearchPage++;
        submitAddressSearch();
    } else {
		$('#zz-postcoder-footer').hide();
	}
}

function showAddressSearchConfirmation(selectedAddress) {
    var addressHTML = '';
    var addressFields = ['address1', 'address2', 'posttown', 'postcode'];

    for (var i in addressFields) {
        var line = selectedAddress[addressFields[i]];

        if (line != null && line.length > 1) {
            addressHTML += line + '<br />';   
        }
    }
	
    for (var key in selectedAddress) {
        var inputElement = $('#zz-postcoder-input-' + key);

        if (inputElement.length) {
            inputElement.val(selectedAddress[key]);
        }
    }
    //$('#zz-selected-address').html(addressHTML);
    $('#zz-postcoder-footer').show();
}

function getSearchAddress() {
    return $('#zz-postcoder-partial-address').val();
}

function initFormAddressSearches() {

	var postcodeFields = $('.zz-postcoder-adhoc-postcode');
	
	postcodeFields.each(function(){
		var postcodeField = $(this);
		var form = postcodeField.closest('form');

		if (form.length) {
			initFormAddressSearch(form);
		}
	});
}

function initFormAddressSearch(form)
{
	var fields = ['postcode', 'uprn', 'address1', 'address2'];
	var inputs = [];
	
	for (var i in fields) {
		var fieldName = fields[i];
		var input = form.find('.zz-postcoder-adhoc-' + fieldName);
	
		if (input.length) {
			inputs[fieldName] = input;
		}
	}
	
	if (!inputs.uprn || !inputs.postcode) {
		return;
	}
	
	inputs.postcode.change(function(){
		var postcode = $(this).val();
		
		if (postcode.length > 3) {
		
			submitAddressSearchRequest(postcode, 0, function (json) {
				var addresses = json.data;
				var uprnInput = inputs.uprn;
				
				toggleSpinner(false);
				
				uprnInput.empty();
				uprnInput.off();
				
				for (var i in addresses) {
					var address = addresses[i];
			
					uprnInput.append($('<option>', { 
						value: address.uprn,
						text: address.summaryline 
					}));
				}
				
				uprnInput.change(function(){
					var uprn = $(this).val();
					
					for (var i in addresses) {
						var address = addresses[i];
						
						if (address.uprn == uprn) {
							if (inputs.address1) {
								inputs.address1.val(address.address1);
							}
							
							if (inputs.address2) {
								inputs.address2.val(address.address2);
							}
						}
					}
				})
			});
		}
	});
}

/* Checkout Form
---------------------------------------*/

function initCheckout()
{
	// Next button
	
	$('#zz-checkout-next-trigger').click(function () {
		var step = $('#zz-order-journey-step').val();
		var validates = true;
			
		if ('book_installation' == step) {
			validates = bookInstallationValidation();
		} else {
			validates = validateCheckoutForm();
		}
		
		if (validates) {
			
			if ('check_postcode' == step && $('#zz-postcoder-product-line').length) {
				
				var postcode = $('#zz-postcoder-input-postcode').val();
				var productLine = $('#zz-postcoder-product-line').val();
				var action = null;
				
				trackEligiblePostcodeEvent(postcode, productLine, action, function() {
					_checkoutForm.submit();
				});
				
			} else if ('contact_details' == step && $('#zz-data-layer-postcode').length && $('#zz-track-eligible-lead').length ) {
				var dlPostcode = $('#zz-data-layer-postcode').val();
				var dlAction = $('#zz-data-layer-action').val();
				var dlType = $('#zz-data-layer-type').val();
				var dlProductLine = $('#zz-data-layer-product_line').val();
		
				trackNewLeadEvent(dlPostcode, dlProductLine, dlType, dlAction, function() {
					_checkoutForm.submit();
				})
			} else {
				_checkoutForm.submit();
			}
			
			toggleSpinner(true);
		}
		
		return false;
	});
	
	// Direct Debit

	var sortCodeInput = $('#checkout_billing_sort_code');
	
	if (sortCodeInput.length) {
		sortCodeInput.val(formatBillingSortCode(sortCodeInput.val()));

		sortCodeInput.keyup(onBillingSortCodeChange);
		sortCodeInput.blur(onBillingSortCodeChange);
	}
	
	$('.zz-dd-guarantee-trigger').click(function(){
		var guarantee = $('#zz-checkout-dd-guarantee');
		
		if (guarantee.is(':visible')) {
			guarantee.hide();
		} else {
			guarantee.show();
			scrollToElement(guarantee);
		}
		
		return false;
	});
	
	$('#zz-custom-billing-address').change(function(){
		var element = $(this);
		var checked = element.is(':checked');
		var addressFields = $('#zz-billing-address')
		
		if (checked) {
			addressFields.show();
			/*
			addressFields.find('input').each(function(){
				var element = $(this);
				element.val('');
			});
			*/
		} else {
			addressFields.hide();
		}		
	});
	
	// Restart/change
	
	$('.zz-cart-restart-button, .zz-order-submit-button, .zz-order-change-trigger').click(function(){
		toggleSpinner(true);
	});
	
	$('.zz-order-change-trigger').click(function(){
		$('#zz-order-change-step').val($(this).data('step'));
		$('#zz-order-change-form').submit();
		
		return false;
	});
	
	// Terms
	
	$('.zz-checkout-terms-trigger').click(function(){
		var terms = $('#zz-checkout-terms');
		
		if (terms.is(':visible')) {
			terms.slideUp();
		} else {
			terms.slideDown();
		}
		
		return false;
	});
	
	$('#zz-checkout-terms a').click(function() {
		var href = $(this).attr('href');
		window.open(href);
		return false;
	});
}

function onBillingSortCodeChange()
{
	var element = $(this);
	element.val(formatBillingSortCode(element.val()));
}

/* Contact/Register for Updates Form
---------------------------------------*/

var _contactRegisterForm;
var _ajaxLoading = false;
var _contactRegisterFormDataLayerVars = {};

function initRegisterContactForm()
{
    _contactRegisterForm = $('#zz-order-journey-form');
    $('#zz-journey-form-submit-trigger').click(onRegisterContactFormSubmit);
}

function onRegisterContactFormSubmit()
{
    if (_ajaxLoading) {
        return false;
    }

    var data = getFormData(_contactRegisterForm);
	data['action'] = 'zz_form_submission';
	
	_contactRegisterFormDataLayerVars = { 
		type: data['data_layer_type'], 
		action: data['data_layer_action'], 
		postcode: data['data_layer_postcode'],
		product_line: data['data_layer_product_line'],
	};
	
    _contactRegisterForm.find('.zz-error').removeClass('zz-error');
	_ajaxLoading = true;

    toggleSpinner(true);
	clearFormErrors(_contactRegisterForm);
	
    $.ajax({
        type: 'post',
        url: zz_settings.ajax_url,
        dataType: 'json',
        data: data,
        complete: function(response){
            _ajaxLoading = false;

            toggleSpinner(false);

            var json = response.responseJSON;

            if (json.success) {
                showContactRegisterFormThanks(json);
            } else if (json.errors) {
                showFormErrors(json.errors);
            }
        }
    });

    return false;
}

function showContactRegisterFormThanks(response)
{

    _contactRegisterForm.find('input, select, textarea').val('');

	$('#zz-journey-form-register').hide();
    $('#zz-journey-form-thanks').show();

	scrollToElement($('#zz-journey-form-thanks'));

    trackEvent(response.ga_tracking_name, 'Submit');

	trackNewLeadEvent(
		_contactRegisterFormDataLayerVars['postcode'], 
		_contactRegisterFormDataLayerVars['product_line'], 
		_contactRegisterFormDataLayerVars['type'],
		_contactRegisterFormDataLayerVars['action'],
	);

    scrollToElement(_contactRegisterForm, -250);
}

/* Forms
---------------------------------------*/

function initInputs()
{
	initCheckboxes();
	
	$('.zz-true-false__label').click(function () {
		var element = $(this);
		var parent = element.closest('.zz-true-false');
		var checkbox = parent.find('input');
		
		checkbox.prop('checked', !checkbox.prop('checked'));
		checkbox.trigger('change');
	});
}

function getFormData(form) {
	var id = form.attr('id');
	var data = new FormData(document.getElementById(id));
	return Array.from(data.keys()).reduce((result, key) => {
		result[key] = data.get(key);
		return result;
	}, {});
}

function showFormError(input, message)
{
	var field = input.closest('.zz-field');
	var messageContainer = field.find('.zz-field__error');
	
	if (message && message.length) {
		if (messageContainer.length) {
			messageContainer.html(message);
		}
	}

	field.addClass('zz-error');
	
	scrollToElement($('.zz-error').first());
}

function showFormErrors(errors)
{
    var focused = false;
    var input;

    for (var i in errors) {
        input = $('#zz_' + i);
        input.closest('.zz-field').addClass('zz-error');

        if (!focused) {
            input.focus();
            scrollToElement(input);
            focused = true;
        }
    }
}

function clearFormErrors(form)
{
	form.find('.zz-field__error').html('');
	form.find('.zz-error').removeClass('zz-error');
}

function initCheckboxes()
{
	var boxes = $('.elementor-widget-form').find('input[type=checkbox]').not('.zz-tickbox');
	
	boxes.each(function(){
		var box = $(this);
		var name = box.attr('name');
		var id = box.attr('id');
		var value = box.val();
		var parent = box.parent();
		
		var html = getCustomCheckboxHTML(name, id, value);
		parent.addClass('zz-custom-tickbox');
		box.replaceWith(html);
	});
}

function getCustomCheckboxHTML(name, id, value)
{
	
	return '<div class="zzoomm"><div class="zz-checkbox">'
		+ '<input type="checkbox" name="' + name + '"  id="' + id + '" value="' + value + '" class="zz-tickbox" />'
		+ '<label for="' + id + '"></label>'
		+ '</div></div>';	
}

/* Validation
---------------------------------------*/

function validateCheckoutForm()
{
	var validates = true;
	var form = _checkoutForm;

	clearFormErrors(form);
	
	var mandatoryFields = form.find('.zz-field.mandatory:visible');
	
	mandatoryFields.each(function(){
		var field = $(this);
		var input = field.find('.zz-input');
		var name = input.attr('name');
		var type = input.attr('type');
		var value = $.trim(input.val());
		
		if (name.match(/_confirm$/i)) {
			var otherFieldName = name.replace(/_confirm$/i, '');
			var otherInput = $('.zz-checkout-input[name="' + otherFieldName + '"]')
			
			if (otherInput.length) {
				var otherValue = $.trim(otherInput.val());
				
				if (otherValue.toLowerCase() != value.toLowerCase()) {
					showFormError(input, 'This needs to match the field above.');
					validates = false;
				}
			}
		} else if ('email' == type && ! validateEmail(value)) {
			showFormError(input, 'Please enter a valid email address.');
			validates = false;
		} else if ('telephone' == name && ! validateTelephone(value)) {
			showFormError(input, 'Please enter a single, valid telephone number.');
			validates = false;
		} else if (!value.length) {
			showFormError(input, 'This is a required field.');
			validates = false;
		}
	});
	
	if ( ! validates ) {
		var firstError = $('.zz-checkout-input.zz-error:first');
		scrollToElement( firstError );
	}

	return validates;
}

function bookInstallationValidation()
{
	var surveyCheckbox = $('#zz-timeslot-acknowledged');
	
	if (surveyCheckbox.is(':visible') && !surveyCheckbox.is(':checked')) {
		showFormError(surveyCheckbox, 'Please confirm you are happy with a second appointment for installation.');
		surveyCheckbox.focus();
		return false;
	}
	
	return true;
}

function validateEmail(email)
{
	email = email.replace(/\+/, '', email);	
	
    var filter = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i
    return filter.test(email);
}

function validateTelephone(telephone)
{
    var filter = /^[0+][0-9\-\s()]{5,15}$/i
    return filter.test(telephone);
}

/* Product Selection
---------------------------------------*/

function initProductSelection()
{
	var parentElements = $('.selection-nested');
	var parentSelectedClass = 'selection-nested--active';

	var productElements = $('.zz-select-product');
	var productSelectedClass = 'selection--selected';
	
	var addonElements = $('.zz-select-addon');
	
	productElements.click(function(){
		var element = $(this);
		
		if (element.hasClass( productSelectedClass)) {
			return false;
		}
		
		var parent = element.parent();
		
		parentElements.removeClass(parentSelectedClass);
		productElements.removeClass(productSelectedClass);
		element.addClass(productSelectedClass);
		parent.addClass(parentSelectedClass);
		
		addonElements.removeClass(productSelectedClass);
		
		populateProductFormInputs();
		
		return false;
	});
	
	addonElements.click(function(){
		
		var element = $(this);
		
		if (element.hasClass(productSelectedClass)) {
			element.removeClass(productSelectedClass);
		} else {
			element.addClass(productSelectedClass);
		}
		
		populateProductFormInputs();
		
		return false;
	});
}

function populateProductFormInputs()
{
	var selectedProductID = '';
	var selectedAddonIDs = '';
	
	var selectedProduct = $('.zz-select-product.selection--selected');
	
	if (selectedProduct.length) {
		selectedProductID = selectedProduct.data('product-id');
		
		var selectedAddons = selectedProduct.parent().find('.zz-select-addon.selection--selected');
		
		var ids = [];
		
		selectedAddons.each(function(){
			ids.push($(this).data('product-id'));
		});
		
		selectedAddonIDs = ids.join(',');
	}
	
	$('#zz-product-fibre-id').val(selectedProductID);
	$('#zz-product-other-ids').val(selectedAddonIDs);
	
	var footer = $('#zz-product-selection-footer');
	
	if ( selectedProductID ) {
		footer.show();
	} else {
		footer.hide();
	}
}

/* Booking Calendar
---------------------------------------*/

var _bookingTimeslots = {};
var _bookingTimeslotsLoaded = false;
var _timeslotsView = 'selected';
var _bookingSurveyRequester;
var _bookingMonthSwitcher;
var _useEarliestSlot = true;

function initCalendar()
{
	var date = new Date();
	var month = date.getMonth() + 1;
	var year = date.getFullYear();
	var calendar = _bookingCalendar;
	var container = $('#zz-book-timeslot');
			
	calendar.find('.zz-cal-reselect-trigger').click(function(){
		_useEarliestSlot = false;
		loadCalendarTimeslots();
		return false;
	});
	
	if (!container.hasClass('zz-cal-success')) {
		container.hide();
		loadCalendarTimeslots();
	} else {
		switchCalendarView('selected');
		container.show();
	}
	
	_bookingSurveyRequester = $('#zz-timeslot-survey-requested');
	
	_bookingSurveyRequester.change(function(){
		loadCalendarTimeslots(null, null, surveyRequested());
	});
	
	$('#zz-timeslot-reselect').click(function(){
		
		if (!_bookingTimeslotsLoaded) {
			loadCalendarTimeslots();
		}
		
		switchCalendarView('reselect');
		toggleBookingReselectControls(false);
		return false;
	});
	
	_bookingMonthSwitcher = $('#zz-booking-calendar-switch-month');
	
	_bookingMonthSwitcher.change(function(){
		var value = $(this).val();
		var tmp = value.split('-');
		var month = parseInt(tmp[1]) - 1;
		loadCalendarTimeslots(month, tmp[0], surveyRequested());
	});
}

function surveyRequested()
{
	return _bookingSurveyRequester.is(':checked');
}

function toggleBookingReselectControls(active)
{
	var controls = $('.zz-timeslot-reselect-hide');
	

	if (active) {
		controls.show();
	} else {
		controls.hide();
	}
}

function loadCalendarTimeslots(month, year, requestSurvey)
{
	toggleSpinner(true);

	if (typeof month != 'undefined') {
		month = month + 1;
	}
	
	var data = { action: 'zz_get_timeslots', month: month, year: year };
	
	if (typeof requestSurvey != 'undefined') {
		data['request_survey'] = requestSurvey ? 1 : 0;
	}
		
	$.ajax({
        type: 'post',
        url: zz_settings.ajax_url,
        dataType: 'json',
        data: data,
        complete: function(response){
            toggleSpinner(false);
            var json = response.responseJSON;
			onCalendarTimeSlotsLoaded(json);
        }
    });
}

function onCalendarTimeSlotsLoaded(response)
{
	var copydeck = response.copydeck;
	
	_bookingTimeslots = response ? response.slots : {};
	_bookingTimeslotsLoaded = true;
	
	$('#zz-timeslots-title').text(copydeck.title);
	$('#zz-timeslots-help').html(copydeck.instructions);
	
	var slots = response.slots;
	
	if (typeof slots == 'undefined') {
		$('#zz-book-timeslot').show();
		return;
	}
		
	var d = 0;
	var initialDateElement = $('#zz-calendar-initial-date');
	
	for (var date in slots) {
		var day = slots[date];

		if (d == 0) {
			var index = 0;
			var firstSlot = day[index];
			populateSelectedDate(initialDateElement, 'Earliest date available', firstSlot.formatted_date, firstSlot.label);
			
			if (_useEarliestSlot) {
				populateBookingInputs(date, index);
			}
		}
		
		d++;
	}
	
	switchCalendarView(_timeslotsView);
	toggleTimeslotCheckboxes(response.type, response.survey_requested);
	$('#zz-book-timeslot').show();
	
	var hasSlots = slots && Object.keys(slots).length;
	
	if (!hasSlots) {
		$('#zz-timeslots-selected, #zz-timeslots-footer, #zz-timeslot-checkbox-survey').hide();
		return;
	}
	
	var setTo = response.set_calendar_to;
	setCalendarTo(setTo.month - 1, setTo.year);
	
	var prevNav = _bookingCalendar.find('.zz-calendar__prev');
	var nextNav = _bookingCalendar.find('.zz-calendar__next');
	
	if (response.allow_nav_back) {
		prevNav.show();
	} else {
		prevNav.hide();
	}
	
	if (response.allow_nav_next) {
		nextNav.show();
	} else {
		nextNav.hide();
	}
}

function populateSelectedDate(element, title, date, times)
{
	element.find('.zz-date-title').text(title);
	element.find('.zz-date-date').text(date);
	element.find('.zz-date-times').text(times);
}

function switchCalendarView(id)
{
	$('.zz-timeslots__view').hide();
	$('#zz-timeslots-' + id).show();
	_timeslotsView = id;
}

function toggleTimeslotCheckboxes(type, surveyRequested)
{
	$('.zz-timeslot-checkbox').hide();
	
	if (type) {
		$('#zz-timeslot-checkbox-' + type).show();
	}

	if (surveyRequested == 1) {
		$('#zz-timeslot-checkbox-installation').show();
	}
}

function setCalendarTo(month, year)
{
	var calendar = _bookingCalendar;
	var startDate = new Date(year, month, 1);
	var startDay = startDate.getDay();
	startDay = (startDay === 0) ? 7 : startDay;
	
	var daysInMonth = new Date(year, month, 0).getDate() + startDay;
	var cells = calendar.find('.zz-cal-td');
	cells.removeClass('inactive');
	
	var d = 1;
	var lastDayNumber = 0;
	
	cells.each(function () {
		var cell = $(this);
		var dayLabel = '';

		var dayLink = cell.find('.dday');
		dayLink.removeClass('available');
		dayLink.removeClass('selected');
		
		var dateLabel = cell.find('.mlabel');
		dateLabel.text('')
		
		if (d >= startDay && d <= daysInMonth) {
			var dateString = startDate.toString();
			var tmp = dateString.split(' ');
			
			cell.addClass('active');
	
			if ( !(d > 28 && tmp[2] <= 5) ) {
				startDate.setDate(startDate.getDate() + 1);
			}
			
			var monthString = (month + 1).toString();
			
			if (monthString.length == 1) {
				monthString = '0' + monthString;
			}
			
			var dateString = [year, monthString, tmp[2]].join('-');
			var config = _bookingTimeslots[dateString];

			if (config) {
				dayLink.addClass('available');
				dateLabel.text(config[0].formatted_date_short)
			}
			
			var dayNumber = parseInt(tmp[2]);
			
			if (dayNumber > lastDayNumber) {
				dayLabel = tmp[2];
				lastDayNumber = dayNumber;
			}
			
			cell.data('date', dateString);
		}
		
		dayLink.text(dayLabel);
		d++;
	});
	
	var surveyRequestInput = $('#zz-timeslot-survey-requested');
	var surveyRequested = surveyRequestInput.is(':checked');

	calendar.find('.zz-calendar__prev').off().click(function(){
		month--;
		
		if (month < 0) {
			month = 11;
			year--;
		}
		
		loadCalendarTimeslots(month, year, surveyRequested);
		
		return false;
	});
	
	calendar.find('.zz-calendar__next').off().click(function(){
		month++;
		
		if (month > 11) {
			month = 0;
			year++
		}
		
		loadCalendarTimeslots(month, year, surveyRequested);
		
		return false;
	});
	
	$('.zz-cal-a').off();
	$('.zz-cal-td').removeClass('selected');
	//onBookingDateSelected();
	
	calendar.find('.zz-cal-a').click(function () {
	
		var element = $(this);
		
		if (element.hasClass('available')) {
			var parent = element.parent();
			$('.zz-cal-td').removeClass('selected');
			parent.addClass('selected');
			onBookingDateSelected();
			
			$('#zz-timeslot-timepickers').show();
		}
		
		return false;
	});
	
	_bookingMonthSwitcher.val(year + '-' + (month + 1) );
}

function onBookingDateSelected()
{
	var config = getSelectedBookingDateConfig();
	var timeInputs = $('.zz-time');
	
	timeInputs.hide();
	timeInputs.removeClass('selected');
	
	toggleBookingReselectControls(false);
	
	for (var i=0;i<config.length;i++) {
		var period = config[i]['period'];
		populateTimeSelector(i, period, config[i]);
	}

	timeInputs.off().click(function () {
		$('.zz-time').removeClass('selected');
		$(this).addClass('selected');
		onBookingTimeSelected();
		return false;
	});
	
	populateBookingSummary();
}

function onBookingTimeSelected()
{
	populateBookingSummary();
	toggleBookingReselectControls(true);
}

function getSelectedBookingDateConfig()
{
	var date = getSelectedBookingDate();
	
	if (date) {
		return _bookingTimeslots[date];
	}
	
	return false;
}

function getSelectedBookingDate()
{
	var selected = $('.zz-cal-td.selected');
	
	if (selected.length) {
		return selected.data('date');
	}
	
	return false;
}

function populateTimeSelector(index, period, config)
{
	period = period.toLowerCase();
	var element = $('#zz-period-select-' + period);
	element.data('index', index);
	element.find('.zz-time__time').text(config['label']);
	element.show();
}

function populateBookingSummary()
{
	var config = getSelectedBookingDateConfig();
	
	if (!config) {
		return false;		
	}
	
	var date = getSelectedBookingDate();
	var displayElement = $('#zz-calendar-selected-date');	
	var timeSelector = $('.zz-time.selected');
	var timeLabel = 'Please select a time';
	
	var selectedDate = config[0].formatted_date;

	if (timeSelector.length) {
		var index = timeSelector.data('index');
		var timeConfig = config[index];
		
		timeLabel = 'Arrival time: ' + timeConfig.label;
		populateBookingInputs(date, index);
	}
	
	populateSelectedDate(displayElement, '', selectedDate, timeLabel);
}

function populateBookingInputs(date, index)
{
	var config = _bookingTimeslots[date];
	var timeConfig = config[index];
	
	var selectedTime = timeConfig.label.toUpperCase();
	var selectedPeriod = timeConfig.period.toUpperCase();
	var selectedDescription = timeConfig.description;
	
	$('#zz-timeslot-date').val(date);
	$('#zz-timeslot-times').val(selectedTime);
	$('#zz-timeslot-period').val(selectedPeriod);
	$('#zz-timeslot-text').val(selectedDescription);
}

/* Survey
---------------------------------------*/

function initSurveys()
{	
	$('.zz-survey').each(function () {
		var survey = $(this);
		var inputSection = survey.find('.zz-survey__other');
		var sessionUID = survey.data('session');

		survey.find('.zz-tickbox').change(function(){
			var input = $(this);
			var checked = input.is(':checked');
			
			if (input.hasClass('zz-survey-user-input') && checked) {
				inputSection.show();
			} else {
				inputSection.find('input').val('');
				inputSection.hide();
			}

		});
		
		survey.find('.zz-tickbox.zz-survey-standalone').change(function(){
			var value = $(this).val();
			
			var data = {
				action: 'zz_thanks_survey',
				value: value,
				session: sessionUID
			}
			
			toggleSpinner(true);
			
			$.ajax({
				type: 'post',
				url: zz_settings.ajax_url,
				dataType: 'json',
				data: data,
				complete: function () {
					survey.slideUp(200);
					toggleSpinner(false);
				}
			})
			
		});
	});
}

/* Loading Spinner
---------------------------------------*/

function toggleSpinner(active)
{
    var element = jQuery('#zz-spinner');

    if (active) {
        element.fadeIn();
    } else {
        element.fadeOut();
    }
}

/* Loading Spinner
---------------------------------------*/

var _progressInterval;
var _progressBar;

function showProgressBar(label, seconds, onComplete)
{
    var element = jQuery('#zz-progress');
	var labelElement = element.find('.zz-progress__label');
	
	_progressBar = element.find('.zz-progress__value');
	labelElement.text(label);
	element.fadeIn();
	
	var elapsedSeconds = 0;
	var percent = 0;
	
	_progressBar.width(0);
	
	clearInterval(_progressInterval);
	
	_progressInterval = setInterval(function(){
		
		elapsedSeconds += 0.1;
		
		percent = (elapsedSeconds / seconds) * 100;
		
		if (percent >= 100) {
			percent = 100;
			completeProgressBar();
			if (onComplete) {
				onComplete();
			}
		}
			
		_progressBar.width(percent + '%');
	}, 100);
}

function completeProgressBar()
{
	
	if (typeof _progressBar == 'undefined') {
		return;
	}
	
	clearInterval(_progressInterval);
	_progressBar.width('100%');
	
	setTimeout(function (){
		jQuery('#zz-progress').fadeOut(function(){
			_progressBar.width(0);
			
		});
	}, 500);
}	

/* Tracking
---------------------------------------*/

function initTracking()
{
	$('.mini-postcode-checker-form').submit(onMiniPostcodeCheckerSubmit);
}

function onMiniPostcodeCheckerSubmit()
{
	var form = $(this);
	var input = form.find('input[type="text"]');
	var postcode = input.val();
	
	if (postcode.length >= 3) {
		trackPostcodeCheckEvent(postcode, function() {
			form.off();
			form.submit();
		});
	}

	return false;
}

function trackPostcodeCheckEvent(postcode, callback)
{
	postcode = normalisePostcode(postcode);
	
	var data = {
		event: 'postcode_check',
		postcode: postcode
	}
	
	pushToDataLayer(data, callback);
}

function trackNewLeadEvent(postcode, productLine, type, action, callback)
{
	postcode = normalisePostcode(postcode);
	
	var data = {
		event: 'lead',
		postcode: postcode,
		product_line: productLine,
		type: type,
		action: action,
	};
	
	pushToDataLayer(data, callback);
}

var _eligiblePostcodeTracked = false;

function trackEligiblePostcodeEvent(postcode, productLine, action, callback)
{
	if (!_eligiblePostcodeTracked ) {
		postcode = normalisePostcode(postcode);
	
		var data = {
			event: 'eligible_postcode_check',
			postcode: postcode,
			product_line: productLine,
		};
		
		if (action) {
			data['action'] = action;
		}
		
		_eligiblePostcodeTracked = true;
		
		pushToDataLayer(data, callback);
	} else {
		callback();
	}
}

function trackEvent(category, action, label, value)
{
    window.dataLayer = window.dataLayer || [];
    
    var data = {
        'event': 'eventTracking',
        'category': category,
        'action': action,
        'label': label
    };

    if (value) {
        data['value'] = value;
    }

    dataLayer.push(data);
}

function pushToDataLayer(data, callback)
{
	window.dataLayer = window.dataLayer || [];
	
	console.log('Pushing to datalayer')
	console.log(data);
	
	if (callback) {
		setTimeout(function(){
			callback();
			console.log('Executing datalayer callback');
		}, 100);
	}
	
	dataLayer.push(data);
}

/* One Touch Switch
---------------------------------------*/

var _otsErrorBox;
var _otsErrorDefault;
var _otsErrorCustom;
var _otsCallToActionWrapper;
var _otsCallToActions;
var _otsOpIn;

function initOneTouchSwitch()
{
	_otsErrorBox = $('#zz-ots-error-box');
	_otsErrorDefault = $('#zz-ots-error-default');
	_otsErrorCustom = $('#zz-ots-error-custom');
	_otsOpIn = $('#zz-ots-opt-in');
	_otsCallToActionWrapper = $('#zz-ots-error-ctas');
	_otsCallToActions = $('.zz-ots-next-action');
	
	$('#zz-ots-optin-wrapper').show();
	
	_otsOpIn.change(function(){
		var element = $(this);
		var toggleable = $('.zz-ots-hidden');
		
		if (element.is(':checked')) {
			toggleable.slideDown();
			toggleOneTouchSwitchFooter(true);
			
		} else {
			toggleable.slideUp();
			hideOneTouchSwitchError();
		}
	});
	
	var validates = false;
	
	$('#zz-checkout-ots-trigger').click(function(){
		
		validates = validateCheckoutForm();
		
		if (validates) {
			submitOneTouchSwitch();
		}
		
		return false;
	});
	
	_otsCallToActions.click(function(){
		
		var action = $(this).data('action');
		var confirmed = true;
		
		if ('continue' == action) {
			confirmed = confirm("Are you sure?\n\nYou will need to contact your current provider to cancel the services you have with them.");
		} else if ('cancel' == action) {
			confirmed = confirm("Are you sure?\n\nThis will cancel the ordering process for now.");
		}
		
		if (confirmed) {
			submitOneTouchSwitchNextAction(action);
		}

		return false;
	});
}

function submitOneTouchSwitch()
{
	var data = getFormData(_checkoutForm);
	
	var task = data.ots_task;
	
	if ('match' == task) {
		submitOneTouchSwitchLookup();
	} else if ('options' == task) {
		submitOneTouchSwitchOptions();
	}
}

function submitOneTouchSwitchLookup()
{
	var data = getFormData(_checkoutForm);
	var otsEligible = data.ots_eligible;
	var otsOptIn = _otsOpIn.is(':checked');
	
	if (1 != otsEligible ) {
		toggleSpinner(true);
		_checkoutForm.submit();
		return false;
	}
	
	hideOneTouchSwitchError();
	toggleOneTouchSwitchFooter(false);
	
		
	data['ots_opt_in'] = otsOptIn ? 1 : 0;
	data['action'] = 'zz_ots_match';	
	delete data._wpnonce;
	

	$.ajax({
        type: 'POST',
		url: zz_settings.ajax_url,
        dataType: 'json',
        data: data,
        complete: function(response){
            completeProgressBar();
			onOneTouchSwitchMatchComplete(response.responseJSON);
        }
    });
	
	
	if (otsOptIn) {
		showProgressBar('Verifying your information - this may take a moment', 65, function(){
			showOneTouchSwitchError({ action: 'retry_or_continue' });
		});
	}
}

function onOneTouchSwitchMatchComplete(response)
{
	var success = response.success;
	var action = response.action;
	
	console.log(response)

	if (!success) {
		showOneTouchSwitchError(response);
	} else {
		toggleSpinner(true);
		redirectToJourneyStart();
	}
}

function showOneTouchSwitchError(response)
{
	var message = response.user_message;
	var customMessage = typeof message != 'undefined';
	
	if (customMessage) {
		_otsErrorDefault.hide();
		_otsErrorCustom.show();
		
		_otsErrorCustom.html(message);
	} else {
		_otsErrorDefault.show();
		_otsErrorCustom.hide();
	}
	
	var nextAction = response.action;
	
	_otsCallToActions.hide();
	_otsCallToActionWrapper.show();
	
	$('#zz-ots-form').hide();
	
	var ctas = _otsCallToActions.filter('.zz-ots-next-action--' + nextAction);
	
	ctas.show();
	
	_otsErrorBox.slideDown();
}

function submitOneTouchSwitchNextAction(nextAction)
{
	var data = {
		action: 'zz_ots_match_next_action',
		next_action: nextAction,
	};
	
	toggleSpinner(true);
	
	$.ajax({
        type: 'POST',
		url: zz_settings.ajax_url,
        dataType: 'json',
        data: data,
        complete: function(response){
			redirectToJourneyStart();
        }
    })
}

function hideOneTouchSwitchError()
{
	_otsErrorBox.slideUp(function(){
		_otsCallToActionWrapper.hide();
	});
}

function submitOneTouchSwitchOptions()
{
	var formData = getFormData(_checkoutForm);
	var reference = formData.switch_order_reference;
	
	if (!reference) {
		scrollToElement($('#zz-ots-options'));
		return false;
	}
	
	toggleSpinner(true);
	
	$.ajax({
        type: 'POST',
		url: zz_settings.ajax_url,
        dataType: 'json',
        data: { action: 'zz_ots_options', order_reference: reference },
        complete: function(response){
			onOneTouchSwitchOptionsComplete(response.responseJSON);
        }
    });
}

function onOneTouchSwitchOptionsComplete(response)
{
	redirectToJourneyStart();
}

function toggleOneTouchSwitchFooter(active)
{
    var element = jQuery('#zz-ots-footer');

    if (active) {
        element.slideDown();
    } else {
        element.slideUp();
    }
}

function retryOneTouchSwitch()
{
	hideOneTouchSwitchError();
	toggleOneTouchSwitchFooter(true);
}

/* Utilities
---------------------------------------*/

function normalisePostcode(postcode)
{
	if (postcode == null) {
		return '';
	}
	
	return postcode.replace(/[^a-z|0-9]/ig, '').toUpperCase();
}

function formatBillingSortCode(sortCode)
{
	sortCode = sortCode.replace(/[^0-9]/g, '');
	var formatted = (String(sortCode).match(/.{1,2}/g) || []).join('-');
	return formatted.substring(0, 8);
}

function scrollToElement(element, offset, speed)
{	
    if (!element.length) {
        return;
    }

    offset = offset ? offset : -150;
    speed = speed ? speed : .5;

    var scrollTop = element.offset().top + offset;

    $('html,body').animate({ scrollTop: scrollTop }, 1000 * speed);
}

function redirectToJourneyStart()
{
	document.location.href = zz_settings.buy_url;
}

}( window.zzoommOrderJourney = window.zzoommOrderJourney || {}, jQuery ));

