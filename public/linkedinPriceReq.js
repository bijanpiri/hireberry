var contries = [
    'kr',
    'cn',
    'id',
    'fi',
    'us',
    'ir'
];

/*var contries = [
 'us',
 'au',
 'be',
 'br',
 'ca',
 'cn',
 'cz',
 'dk',
 'fr',
 'de',
 'in',
 'id',
 'it',
 'jp',
 'kr',
 'my',
 'mx',
 'md',
 'nl',
 'nz',
 'no',
 'ph',
 'pl',
 'pt',
 'ro',
 'ru',
 'za',
 'es',
 'se',
 'ch',
 'tw',
 'th',
 'tr',
 'gb'
 ];*/


/*var contries = [
 // 'us',
 'af',
 'ax',
 'al',
 'dz',
 'as',
 'ad',
 'ao',
 'ai',
 'aq',
 'ag',
 'ar',
 'am',
 'aw',
 // 'au',
 'at',
 'az',
 'bs',
 'bh',
 'bd',
 'bb',
 'by',
 // 'be',
 'bz',
 'bj',
 'bm',
 'bt',
 'bo',
 'ba',
 'bw',
 // 'br',
 'io',
 'bn',
 'bg',
 'bf',
 'bi',
 'kh',
 'cm',
 // 'ca',
 'cv',
 'cb',
 'ky',
 'cf',
 'td',
 'cl',
 // 'cn',
 'cx',
 'cc',
 'co',
 'km',
 'cg',
 'ck',
 'cr',
 'ci',
 'hr',
 'cu',
 'cy',
 // 'cz',
 'cd',
 // 'dk',
 'dj',
 'dm',
 'do',
 'tp',
 'ec',
 'eg',
 'sv',
 'gq',
 'er',
 'ee',
 'et',
 'fk',
 'fo',
 'fm',
 'fj',
 'fi',
 // 'fr',
 'gf',
 'pf',
 'tf',
 'ga',
 'gm',
 'ge',
 // 'de',
 'gh',
 'gi',
 'gr',
 'gl',
 'gd',
 'gp',
 'gu',
 'gt',
 'gg',
 'gn',
 'gw',
 'gy',
 'ht',
 'hn',
 'hk',
 'hu',
 'is',
 // 'in',
 // 'id',
 'ir',
 'iq',
 'ie',
 'im',
 'il',
 // 'it',
 'jm',
 // 'jp',
 'je',
 'jo',
 'kz',
 'ke',
 'ki',
 // 'kr',
 'kp',
 'ko',
 'kw',
 'kg',
 'la',
 'lv',
 'lb',
 'ls',
 'lr',
 'ly',
 'li',
 'lt',
 'lu',
 'mo',
 'mk',
 'mg',
 'mw',
 // 'my',
 'mv',
 'ml',
 'mt',
 'mh',
 'mq',
 'mr',
 'mu',
 'yt',
 // 'mx',
 // 'md',
 'mc',
 'mn',
 'me',
 'ms',
 'ma',
 'mz',
 'mm',
 'na',
 'nr',
 'np',
 // 'nl',
 'an',
 'nc',
 // 'nz',
 'ni',
 'ne',
 'ng',
 'nu',
 'nf',
 'mp',
 // 'no',
 'om',
 'pk',
 'pw',
 'ps',
 'pa',
 'pg',
 'py',
 'pe',
 // 'ph',
 'pn',
 // 'pl',
 // 'pt',
 'pr',
 'qa',
 're',
 // 'ro',
 // 'ru',
 'rw',
 'sh',
 'kn',
 'lc',
 'pm',
 'vc',
 'ws',
 'sm',
 'st',
 'sa',
 'sn',
 'rs',
 'sc',
 'sl',
 'sg',
 'sk',
 'si',
 'sb',
 'so',
 // 'za',
 'ss',
 // 'es',
 'lk',
 'sd',
 'sr',
 'sj',
 'sz',
 // 'se',
 // 'ch',
 'sy',
 // 'tw',
 'tj',
 'tz',
 // 'th',
 'tl',
 'tg',
 'tk',
 'to',
 'tt',
 'tn',
 // 'tr',
 'tm',
 'tc',
 'tv',
 'ug',
 'ua',
 'ae',
 // 'gb',
 'uy',
 'uz',
 'vu',
 'va',
 've',
 'vn',
 'vg',
 'vi',
 'wf',
 'eh',
 'ye',
 'zm',
 'zw',
 'oo'];*/


//contries = ['fi','ir','gb','us','ye'];

var result = {};

function getPrices(cn,postalCodes) {

    (function(){
        $.post('https://www.linkedin.com/job/consumer/commonPost/getPricesByLocationAjax',{
            countryCode: cn,
            postalCode: '',
            productCode:'jobListing',
            promoCode:'noJobPromoCode'
        }).done( function(res){
                //var p = $(res.html.replace(/\n/g,''));
                var p = $('<div>').append( $(res.html.replace(/\n/g,'')) );
                vPrice = p.find('.single-job.estimated-amount div').text().trim();
                vHasPostalcode=p.find('.error');
                console.log(cn+"--vHasPostalcode="+vHasPostalcode.text()+"("+vHasPostalcode.length+")");
                if(vHasPostalcode.length==0)
                {
                    vPrice = p.find('.single-job.estimated-amount div').text().trim();
                    result[cn]['-1'] = vPrice;

                }
                else
                {
                    for( var i=0; i<postalCodes.length; i++ ) {

                        (function(pcode){
                            $.post('https://www.linkedin.com/job/consumer/commonPost/getPricesByLocationAjax',{
                                countryCode: cn,
                                postalCode: pcode,
                                productCode:'jobListing',
                                promoCode:'noJobPromoCode'
                            }).done( function(res){
                                    var p = $('<div>').append( $(res.html.replace(/\n/g,'')) );
                                    vArea=p.find('.location ').text().trim();
                                    vPrice = p.find('.single-job.estimated-amount div').text().trim();
                                    vLocation = p.find('#field-country :selected').text().trim();
                                    //console.log(vLocation, pcode, vPrice,vArea);
                                    if(pcode=='-1')
                                    {
                                        result[cn][pcode] = vPrice;
                                    }
                                    else
                                    {
                                        if( !result[cn][pcode] )
                                        {
                                            var item={'Price':vPrice,'Area':vArea};
                                            result[cn][pcode] = [];
                                            result[cn][pcode]= item ;
                                        }
                                    }
                                });
                        })(postalCodes[i]);
                    }
                }
            });
    })();

}

function Go() {
    for( var i=0; i<contries.length; i++ ) {

        (function(cn){
            result[cn] = {};

            $.get('http://www.geonames.org/postalcode-search.html?q=&country=' + cn ).done( function(res){
                postalCodes=[];
                $(res).find('.restable tr :nth-child(3)').each( function(i,e){
                    if($(e).text()!="Code")
                        postalCodes.push($(e).text())
                });

                if( $(res).find('.restable tr :nth-child(3)').length == 0 )
                    postalCodes = [-1];

                getPrices( cn, postalCodes );
            });
        })(contries[i]);
    }
}
Go();
