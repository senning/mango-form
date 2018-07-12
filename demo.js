jQuery(document).ready(function($){
  var $body = $("body");
  var $form = $("form");
  var $steps = $(".form-steps");

  setFocus();
  stopLoading();
  handleSteps();
  handleAmountChange();
  handleOtherAmount();
  handleTextFields();
  populateCountryField();
  validateFields();
  handleMetaOptions();
  handleDependencies();

  function setFocus(){
    $("[name='donation_type']").eq(0).focus();
  }

  /**
   * [stopLoading description]
   * @return {[type]} [description]
   */
  function stopLoading(){
    $body
      .removeClass("is-loading")
      .addClass("has-animations has-steps");
  }

  /**
   * [handleSteps description]
   * @return {[type]} [description]
   */
  function handleSteps(){
    var steps = $steps.children("fieldset");
    var activeStep = 0;
    var $prevButton = $form.find(".form-prev");
    var $nextButton = $form.find(".form-next");
    var $stepCounter = $form.find(".js-stepCounter");

    var nextText = "Next";
    var submitText = "Donate <span class='js-donationAmount'></span>";

    steps.eq(0)
      .addClass("is-active");
    steps.filter(":gt(0)").prop("hidden", true);

    //set the body height to accomodate our tallest step
    var fieldsetHeights = $.map(steps, function(item){
      return $(item).innerHeight();
    });
    var maxHeight = Math.max.apply(null, fieldsetHeights);
    var currentHeight = $steps.innerHeight();
    var heightDifference = maxHeight - currentHeight;
    $("body").css("minHeight", $("body").outerHeight() + heightDifference);
    createStepCounter();

    //replace the next button text
    $nextButton
      .html("<span class='is-next'>"+nextText+"</span><span class='is-submit'>"+submitText+"</span>");

    $form
      .on("click", ".form-next", next)
      .on("click", ".form-prev", prev);

    function next(e){
      e.preventDefault();
      goTo(activeStep + 1);
      createStepCounter();
    }

    function prev(e){
      e.preventDefault();
      goTo(activeStep - 1);
      createStepCounter();
    }

    function createStepCounter(){
      $stepCounter.empty();
      var counters = "";
      for(var i = 0; i < steps.length; i++){
        if(i === activeStep){
          counters += '<i class="stepCount is-active" />';
        }
        else if (i < activeStep){
          counters += '<i class="stepCount is-done" />';
        }
        else{
          counters += '<i class="stepCount is-upcoming" />';
        }
      }

      $stepCounter.html(counters);
    }

    function goTo(step){
      //validate all previous steps
      var invalids = false;
      for(var i = 0; i < step; i++){
        var fields = steps.eq(i).find("input,select,textarea")

        fields.removeClass("is-new");
        invalids = fields.filter(function(){
          return $(this).is(":invalid");
        });

        if(invalids.length){
          break;
        }
      }
      if(invalids.length){
        invalids.eq(0).focus();
        return false;
      }

      //check the requested step is available

      //make the selected step active
      var activeStepEl = steps.eq(step);
      steps
        .removeClass("is-active")
        .prop("hidden", true);
      activeStepEl
        .addClass("is-active")
        .prop("hidden", false);
      activeStepEl.find("input,select,textarea").eq(0).focus();
      activeStep = step;

      //show or hide prev button
      $prevButton.prop("disabled", step <= 0);

      //set next to submit on the last step
      if(step === steps.length - 1){
        $form.addClass("is-submitStep");
      }
      else{
        $form.removeClass("is-submitStep");
      }

    }
  }

  /**
   * [handleAmountChange description]
   * @return {[type]} [description]
   */
  function handleAmountChange(){
    var $amounts = $form.find("[name='donation_amount']");
    $amounts.on("change", populateAmounts);
    $amounts.filter(":checked").trigger("change");

    function populateAmounts(e){
      var amount = e.target.value;
      amount = parseFloat(amount).toLocaleString("en",{style:"currency", currency: "USD"});

      $(".js-donationAmount").text(amount);
    }

  }

  /**
   * [handleOtherAmount description]
   * @return {[type]} [description]
   */
  function handleOtherAmount(){
    var $inputContainer = $form.find("#donation_amount-otherInput");
    var $input = $inputContainer.find("input");
    var $radio = $inputContainer.prev(".radio-input");
    var $amounts = $form.find("[name='donation_amount']");
    var $lastAmount = null;
    var hadValue = false;

    $inputContainer.on("keyup change", handleOtherAmountChange);
    $amounts.on("change", clearOtherAmount);

    //if the other amount field started with a value, start with it selected
    if($input.val()){
      $input.trigger("change");
    }

    function handleOtherAmountChange(e){
      //we should also check validation
      if(e.target.value){
        $radio.val(e.target.value);
        hadValue = true;

        //if we're changing from a different amount, we want to save it so we can go back to it if the donor removes their custom amount
        if(
          !$lastAmount
          || !$amounts.filter(":checked").is($radio)
          ){
          $lastAmount = $amounts.filter(":checked");
          $radio.prop("checked", true);
        }
      }
      else{
        //only try to check a previous value if the other amount is what's currently checked
        if(!$radio.prop("checked")){

        } 
        else if($lastAmount){
          $lastAmount.prop("checked", true);
        }
        else{
          $amounts.eq(0).prop("checked", true); 
        }
        hadValue = false;
        $lastAmount = false;
      }
    }

    function clearOtherAmount(e){
      if(!$radio.is(e.target)){
        $input.val("");
        $input.trigger("change");
      }
    }
  }

  /**
   * [handleTextFields description]
   * @return {[type]} [description]
   */
  function handleTextFields(){
    var $fields = $form.find(".text-label");
    $fields
      .on("keyup change", checkFieldValue)
      .on("focusin", setFieldFocus)
      .on("focusout", unsetFieldFocus);

    $fields.each(checkFieldValue);

    //add is-new class so we're only applying validation styling to focused fields
    $fields.find("input")
      .filter(fieldHasNoValue)
      .addClass("is-new");

    function checkFieldValue(e){
      var $label = $(this);
      var $text = $label.find("input");

      if($text.val()){
        $label.addClass("has-value");
      }
      else{
        $label.removeClass("has-value");
      }
    }

    function setFieldFocus(){
      $(this)
        .addClass("is-focussed");
    }

    function unsetFieldFocus(){
      $(this).removeClass("is-focussed");
      $(this)
        .find("input")
        .removeClass("is-new");
    }

  }

  function populateCountryField(){
    $(".js-country")
      .html("<option value='CA'>Canada</option><option value='US'>United States</option><option value=''>-----</option><option value='AF'>Afghanistan</option><option value='AX'>Åland Islands</option><option value='AL'>Albania</option><option value='DZ'>Algeria</option><option value='AS'>American Samoa</option><option value='AD'>Andorra</option><option value='AO'>Angola</option><option value='AI'>Anguilla</option><option value='AQ'>Antarctica</option><option value='AG'>Antigua and Barbuda</option><option value='AR'>Argentina</option><option value='AM'>Armenia</option><option value='AW'>Aruba</option><option value='AU'>Australia</option><option value='AT'>Austria</option><option value='AZ'>Azerbaijan</option><option value='BS'>Bahamas</option><option value='BH'>Bahrain</option><option value='BD'>Bangladesh</option><option value='BB'>Barbados</option><option value='BY'>Belarus</option><option value='BE'>Belgium</option><option value='BZ'>Belize</option><option value='BJ'>Benin</option><option value='BM'>Bermuda</option><option value='BT'>Bhutan</option><option value='BO'>Bolivia</option><option value='BQ'>Bonaire, Sint Eustatius and Saba</option><option value='BA'>Bosnia and Herzegovina</option><option value='BW'>Botswana</option><option value='BV'>Bouvet Island</option><option value='BR'>Brazil</option><option value='IO'>British Indian Ocean Territory</option><option value='BN'>Brunei Darussalam</option><option value='BG'>Bulgaria</option><option value='BF'>Burkina Faso</option><option value='BI'>Burundi</option><option value='KH'>Cambodia</option><option value='CM'>Cameroon</option><option value='CV'>Cape Verde</option><option value='KY'>Cayman Islands</option><option value='CF'>Central African Republic</option><option value='TD'>Chad</option><option value='CL'>Chile</option><option value='CN'>China</option><option value='CX'>Christmas Island</option><option value='CC'>Cocos (Keeling) Islands</option><option value='CO'>Colombia</option><option value='KM'>Comoros</option><option value='CG'>Congo</option><option value='CD'>Democratic Republic of the Congo</option><option value='CK'>Cook Islands</option><option value='CR'>Costa Rica</option><option value='CI'>Côte d'Ivoire</option><option value='HR'>Croatia</option><option value='CU'>Cuba</option><option value='CW'>Curaçao</option><option value='CY'>Cyprus</option><option value='CZ'>Czech Republic</option><option value='DK'>Denmark</option><option value='DJ'>Djibouti</option><option value='DM'>Dominica</option><option value='DO'>Dominican Republic</option><option value='EC'>Ecuador</option><option value='EG'>Egypt</option><option value='SV'>El Salvador</option><option value='GQ'>Equatorial Guinea</option><option value='ER'>Eritrea</option><option value='EE'>Estonia</option><option value='ET'>Ethiopia</option><option value='FK'>Falkland Islands (Malvinas)</option><option value='FO'>Faroe Islands</option><option value='FJ'>Fiji</option><option value='FI'>Finland</option><option value='FR'>France</option><option value='GF'>French Guiana</option><option value='PF'>French Polynesia</option><option value='TF'>French Southern Territories</option><option value='GA'>Gabon</option><option value='GM'>Gambia</option><option value='GE'>Georgia</option><option value='DE'>Germany</option><option value='GH'>Ghana</option><option value='GI'>Gibraltar</option><option value='GR'>Greece</option><option value='GL'>Greenland</option><option value='GD'>Grenada</option><option value='GP'>Guadeloupe</option><option value='GU'>Guam</option><option value='GT'>Guatemala</option><option value='GG'>Guernsey</option><option value='GN'>Guinea</option><option value='GW'>Guinea-Bissau</option><option value='GY'>Guyana</option><option value='HT'>Haiti</option><option value='HM'>Heard Island and McDonald Islands</option><option value='VA'>Holy See (Vatican City State)</option><option value='HN'>Honduras</option><option value='HK'>Hong Kong</option><option value='HU'>Hungary</option><option value='IS'>Iceland</option><option value='IN'>India</option><option value='ID'>Indonesia</option><option value='IR'>Islamic Republic of Iran</option><option value='IQ'>Iraq</option><option value='IE'>Ireland</option><option value='IM'>Isle of Man</option><option value='IL'>Israel</option><option value='IT'>Italy</option><option value='JM'>Jamaica</option><option value='JP'>Japan</option><option value='JE'>Jersey</option><option value='JO'>Jordan</option><option value='KZ'>Kazakhstan</option><option value='KE'>Kenya</option><option value='KI'>Kiribati</option><option value='KP'>Democratic People's Republic of Korea</option><option value='KR'>Republic of Korea</option><option value='KW'>Kuwait</option><option value='KG'>Kyrgyzstan</option><option value='LA'>Lao People's Democratic Republic</option><option value='LV'>Latvia</option><option value='LB'>Lebanon</option><option value='LS'>Lesotho</option><option value='LR'>Liberia</option><option value='LY'>Libya</option><option value='LI'>Liechtenstein</option><option value='LT'>Lithuania</option><option value='LU'>Luxembourg</option><option value='MO'>Macao</option><option value='MK'>Former Yugoslav Republic of Macedonia</option><option value='MG'>Madagascar</option><option value='MW'>Malawi</option><option value='MY'>Malaysia</option><option value='MV'>Maldives</option><option value='ML'>Mali</option><option value='MT'>Malta</option><option value='MH'>Marshall Islands</option><option value='MQ'>Martinique</option><option value='MR'>Mauritania</option><option value='MU'>Mauritius</option><option value='YT'>Mayotte</option><option value='MX'>Mexico</option><option value='FM'>Federated States of Micronesia</option><option value='MD'>Republic of Moldova</option><option value='MC'>Monaco</option><option value='MN'>Mongolia</option><option value='ME'>Montenegro</option><option value='MS'>Montserrat</option><option value='MA'>Morocco</option><option value='MZ'>Mozambique</option><option value='MM'>Myanmar</option><option value='NA'>Namibia</option><option value='NR'>Nauru</option><option value='NP'>Nepal</option><option value='NL'>Netherlands</option><option value='NC'>New Caledonia</option><option value='NZ'>New Zealand</option><option value='NI'>Nicaragua</option><option value='NE'>Niger</option><option value='NG'>Nigeria</option><option value='NU'>Niue</option><option value='NF'>Norfolk Island</option><option value='MP'>Northern Mariana Islands</option><option value='NO'>Norway</option><option value='OM'>Oman</option><option value='PK'>Pakistan</option><option value='PW'>Palau</option><option value='PS'>State of Palestine</option><option value='PA'>Panama</option><option value='PG'>Papua New Guinea</option><option value='PY'>Paraguay</option><option value='PE'>Peru</option><option value='PH'>Philippines</option><option value='PN'>Pitcairn</option><option value='PL'>Poland</option><option value='PT'>Portugal</option><option value='PR'>Puerto Rico</option><option value='QA'>Qatar</option><option value='RE'>Réunion</option><option value='RO'>Romania</option><option value='RU'>Russian Federation</option><option value='RW'>Rwanda</option><option value='BL'>Saint Barthélemy</option><option value='SH'>Saint Helena, Ascension and Tristan da Cunha</option><option value='KN'>Saint Kitts and Nevis</option><option value='LC'>Saint Lucia</option><option value='MF'>Saint Martin (French part)</option><option value='PM'>Saint Pierre and Miquelon</option><option value='VC'>Saint Vincent and the Grenadines</option><option value='WS'>Samoa</option><option value='SM'>San Marino</option><option value='ST'>Sao Tome and Principe</option><option value='SA'>Saudi Arabia</option><option value='SN'>Senegal</option><option value='RS'>Serbia</option><option value='SC'>Seychelles</option><option value='SL'>Sierra Leone</option><option value='SG'>Singapore</option><option value='SX'>Sint Maarten (Dutch part)</option><option value='SK'>Slovakia</option><option value='SI'>Slovenia</option><option value='SB'>Solomon Islands</option><option value='SO'>Somalia</option><option value='ZA'>South Africa</option><option value='GS'>South Georgia and the South Sandwich Islands</option><option value='SS'>South Sudan</option><option value='ES'>Spain</option><option value='LK'>Sri Lanka</option><option value='SD'>Sudan</option><option value='SR'>Suriname</option><option value='SJ'>Svalbard and Jan Mayen</option><option value='SZ'>Swaziland</option><option value='SE'>Sweden</option><option value='CH'>Switzerland</option><option value='SY'>Syrian Arab Republic</option><option value='TW'>Taiwan, Province of China</option><option value='TJ'>Tajikistan</option><option value='TZ'>United Republic of Tanzania</option><option value='TH'>Thailand</option><option value='TL'>Timor-Leste</option><option value='TG'>Togo</option><option value='TK'>Tokelau</option><option value='TO'>Tonga</option><option value='TT'>Trinidad and Tobago</option><option value='TN'>Tunisia</option><option value='TR'>Turkey</option><option value='TM'>Turkmenistan</option><option value='TC'>Turks and Caicos Islands</option><option value='TV'>Tuvalu</option><option value='UG'>Uganda</option><option value='UA'>Ukraine</option><option value='AE'>United Arab Emirates</option><option value='GB'>United Kingdom</option><option value='UM'>United States Minor Outlying Islands</option><option value='UY'>Uruguay</option><option value='UZ'>Uzbekistan</option><option value='VU'>Vanuatu</option><option value='VE'>Bolivarian Republic of Venezuela</option><option value='VN'>Viet Nam</option><option value='VG'>British Virgin Islands</option><option value='VI'>U.S. Virgin Islands</option><option value='WF'>Wallis and Futuna</option><option value='EH'>Western Sahara</option><option value='YE'>Yemen</option><option value='ZM'>Zambia</option><option value='ZW'>Zimbabwe</option>");
  }


  /**
   * [validateFields description]
   * @param  {[type]} fields [description]
   * @return {[type]}        [description]
   */
  function validateFields(){
    $form.find("input,select")
      .on("change", validate);

    //on startup, trigger validation for any already-filled fields
    $form.find("input[type=text],select")
      .filter(fieldHasValue)
      .trigger("change");

    function validate(e){
      var $input = $(this);
      var $label = $input.closest("label");

      if($input.is(":valid")){
        $label.addClass("is-valid");
      }
      else{
        $label.removeClass("is-valid");
      }

      if($input.is(":invalid")){
        $label.addClass("is-invalid");
      }
      else{
        $label.removeClass("is-invalid");
      }
    }
  }

  function handleMetaOptions(){
    var hasAnimations = $body.hasClass("has-animations");
    var hasSteps = $body.hasClass("has-steps");
    var $animationToggle = $(".js-toggleAnimations");
    var $stepToggle = $(".js-oneStepForm");
    var steps = $steps.children("fieldset");

    $animationToggle.on("click", toggleAnimations);
    $stepToggle.on("click", toggleSteps);

    function toggleAnimations(){
      hasAnimations = !hasAnimations;
      $body.toggleClass("has-animations");
      $animationToggle.text(hasAnimations ? "Turn off animations" : "Turn on animations");
    }

    function toggleSteps(){
      hasSteps = !hasSteps;
      $body.toggleClass("has-steps");
      $stepToggle.text(hasSteps ? "Show all form fields" : "Show form with steps");

      if(hasSteps){
        steps.filter(":not(.is-active)").prop("hidden", true);
      } else { 
        steps.filter("[hidden]").prop("hidden", false);
      }
    }
  }

  function handleDependencies(){
    var $donationType = $("[name='donation_type']");
    var $installmentsNum = $(".js-installments");
    var $paymentType = $("[name='paymenttype']");
    var $ccPaymentFields = $(".js-ccfield");

    $donationType.on("change", function(e){
      if(e.target.value === "installments"){
        $installmentsNum.prop("hidden", false);
        $installmentsNum.find("input").prop("required", true);
      }
      else{
        $installmentsNum.prop("hidden", true);
        $installmentsNum.find("input").prop("required", false);
      }
    })
    $donationType.filter(":checked").trigger("change");

    $paymentType.on("change", function(e){
      console.log(e.target.value);
      if(e.target.value === "credit-card"){
        $ccPaymentFields.prop("hidden", false);
      }
      else{
        $ccPaymentFields.prop("hidden", true);
      }
    })
    $paymentType.trigger("change");
  }

  /**
   * [submit description]
   * @return {[type]} [description]
   */
  function submit(e){
    e.preventDefault();
  }

  /**
   * Utils
   */
  
  function fieldHasNoValue(){
    return !this.value;
  }

  function fieldHasValue(){
    return !!this.value;
  }

})