var version = '0.3.0 (2015/07/07)';
//$(function() { $("#parametersdiv").draggable(); }); // doesn't work well, disabled
var me = document.location.toString().match(/^file:/)?'web-offline':'web-online'; // me: {cli, web-offline, web-online}
var browser = 'unknown';
var showEditor = true;
var remoteUrl = './remote.pl?url=';
if(navigator.userAgent.match(/(opera|chrome|safari|firefox|msie)/i))
   browser = RegExp.$1.toLowerCase();

$(document).ready(function() {
   $("#menu").height($(window).height());       // initial height

   $(window).resize(function() {                // adjust the relevant divs
      $("#menu").height($(window).height());
      $("#menuHandle").css({top: '45%'});
   });
   setTimeout( function(){$('#menu').css('left','-280px');},500); // -- hide slide-menu after 0.5secs

   $('#menu').mouseleave(function() {
      $('#examples').css('height',0); $('#examples').hide(); 
      $('#options').css('height',0); $('#options').hide(); 
   });

   // -- Examples
   $('#examplesTitle').click(function() {
      $('#examples').css('height','auto'); 
      $('#examples').show(); 
      $('#options').css('height',0); $('#options').hide(); 
   });
   $('#examples').mouseleave(function() {
      $('#examples').css('height',0); $('#examples').hide(); 
   });

   // -- Options 
   $('#optionsTitle').click(function() {
      $('#options').css('height','auto'); $('#options').show(); 
      $('#examples').css('height',0); $('#examples').hide(); 
   });
   $('#options').mouseleave(function() {
      $('#options').css('height',0); $('#options').hide(); 
   });
   getOptions();
// 
   //$('#optionsForm').submit(function() {
   //   // save to cookie
   //   $('#optionsForm').hide();
   //   return false;
   //});
   $('#optionsForm').change(function() {
      // save to cookie
      saveOptions();
   });
   
   $('#plate').change(function() {
      if($('#plate').val()=='custom') {
         $('#customPlate').show();
      } else {
         $('#customPlate').hide();
      }
   });
});   