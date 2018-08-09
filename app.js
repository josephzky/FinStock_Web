var http = require('http'); 
var xml2js = require('xml2js');
var urlData = require('url');
var request = require('sync-request');

var sever = http.createServer(function (req, res) {
      var company = urlData.parse(req.url, true)['query']['symbol'];
      var todo = urlData.parse(req.url, true)['query']['todo'];

// auto complete
      if (todo == 'auto') {
          var url = 'http://dev.markitondemand.com/MODApis/Api/v2/Lookup/json?input='+company;     
          try {
          var resq = request('GET', url);
          var json = JSON.parse(resq.getBody('utf8'));
          var autoJSON = {};
          var autoArr = new Array();
          var temp;
          var str;

          var count = 0;
          while (count < json.length) {
              temp = json[count];
              str = temp["Symbol"] + " - " + temp["Name"] + " (" + temp["Exchange"] + ")";
              autoArr.push({'value':temp["Symbol"], 'display':str});
              count += 1;
              if (count >= 5) { break; }
          }
          autoJSON['autoComp'] = autoArr;

          res.setHeader("Access-Control-Allow-Origin", "*"); 
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify(autoJSON));
          console.log('autoComp');
          }
          catch (err) {
            console.log('TRYCATCHSUCCESS');
          }
          res.end();
      }

  // details
      if (todo == 'details') {
          var url = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol='+company+'&outputsize=full&apikey=TK9IT11RQ6G0AM0N';      
      try {
          var resq = request('GET', url);
          var json = JSON.parse(resq.getBody('utf8'));
          var stockTickerSymbol = json["Meta Data"]["2. Symbol"];
          var timeSeries = json["Time Series (Daily)"];
          var temp = 1;
          var detailsJSON = {};
          for (var lastDate in timeSeries) {
              if (temp == 1) {
                  var open = json["Time Series (Daily)"][lastDate]["1. open"];
                  var high = json["Time Series (Daily)"][lastDate]["2. high"];
                  var low = json["Time Series (Daily)"][lastDate]["3. low"];
                  var close = json["Time Series (Daily)"][lastDate]["4. close"];
                  var volume = parseInt(json["Time Series (Daily)"][lastDate]["5. volume"]);
                  if (close > open) { 
                    var colorFlag = '1';
                  } else if (close < open) {
                    var colorFlag = '0';
                  } else {
                    var colorFlag = '2';
                  }
              }
              if (temp == 2){
                  var previousClose = json["Time Series (Daily)"][lastDate]["4. close"];
                  break;
              }
              temp++;
          }
          var lastPrice = (Math.round(close*100)/100).toFixed(2);
          var priceChange = (Math.round((close-open)*100)/100).toFixed(2);
          var changePercent = (Math.round(100*(close-open)*100/open)/100).toFixed(2);


          var timeStamps = json["Meta Data"]["3. Last Refreshed"];
          if (timeStamps.length == 10) {
            timeStamps += ' 16:00:00';
          }
          timeStamps += ' EDT';

          detailsJSON['stockTickerSymbol'] = stockTickerSymbol;
          detailsJSON['lastPrice'] = lastPrice;
          detailsJSON['changePercent'] = changePercent;
          detailsJSON['timeStamps'] = timeStamps;
          detailsJSON['open'] = (Math.round(open*100)/100).toFixed(2);
          detailsJSON['previousClose'] = (Math.round(previousClose*100)/100).toFixed(2);
          detailsJSON['range1'] = (Math.round(open*100)/100).toFixed(2);
          detailsJSON['range2'] = (Math.round(close*100)/100).toFixed(2);
          detailsJSON['volume'] = volume;
          detailsJSON['colorFlag'] = colorFlag;
          detailsJSON['priceChange'] = priceChange;

          res.setHeader("Access-Control-Allow-Origin", "*"); 
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify(detailsJSON));
          console.log('details');
          }
          catch (err) {
            console.log('TRYCATCHSUCCESS');
          }
            res.end();
      }

  // price
      if (todo == 'price') {
          var url = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol='+company+'&outputsize=full&apikey=TK9IT11RQ6G0AM0N';     
          try {
          var resq = request('GET', url);
          var json = JSON.parse(resq.getBody('utf8'));
          var priceJSON = {};

          var lastDate = json["Meta Data"]["3. Last Refreshed"];
          var symbol = json["Meta Data"]["2. Symbol"];
          var title = symbol + ' Stock Price and Volume';
          var timeArr = new Array();
          var priceArr = new Array();
          var Arr = new Array();   
          var volumeArr = new Array();
          var count = 0;
          for (var key in json["Time Series (Daily)"]) {
              timeArr.push(key.substring(5,7)+'/'+key.substring(8));
              priceArr.push(parseFloat(json["Time Series (Daily)"][key]["4. close"]));
              volumeArr.push(parseInt(json["Time Series (Daily)"][key]["5. volume"]));
              count += 1;
              if (( ((new Date(lastDate)).getTime()/1000 - (new Date(key)).getTime()/1000) >= 174*24*60*60) && (count % 7 == 0)) {
                  break;
              }
          }
          priceJSON['symbol'] = symbol;
          priceJSON['title'] = title;
          priceJSON['timeArr'] = timeArr.reverse();
          priceJSON['priceArr'] = priceArr.reverse();
          priceJSON['volumeArr'] = volumeArr.reverse();

          res.setHeader("Access-Control-Allow-Origin", "*"); 
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify(priceJSON));
          console.log('price');
          }
          catch (err) {
            res.write('failed');
            console.log('TRYCATCHSUCCESS');
          }
          res.end();
      }

// SMA
      if (todo == 'SMA') {
          var urlSMA = 'https://www.alphavantage.co/query?function=SMA&symbol='+company+'&interval=daily&time_period=10&series_type=close&apikey=TK9IT11RQ6G0AM0N';     
          
          try{
          var resq = request('GET', urlSMA);
          var json = JSON.parse(resq.getBody('utf8'));
          var smaJSON = {};

          var timeArr = new Array();
          var lastDate = json["Meta Data"]["3: Last Refreshed"];
          var indTitle = json["Meta Data"]["2: Indicator"];
          var symbol = json["Meta Data"]["1: Symbol"];
          var value = []; 
          var count = 0;
          var techAnalysis = "Technical Analysis: " + "SMA";
          for (var key in json[techAnalysis]) {
              timeArr.push(key.substring(5,7)+'/'+key.substring(8,10));
              value.push(parseFloat(json[techAnalysis][key]["SMA"]));
              count += 1;
              if (( ((new Date(lastDate)).getTime()/1000 - (new Date(key)).getTime()/1000) >= 174*24*60*60) && (count % 7 == 0)) {
                  break;
              }
          } 
          smaJSON['SMAvalue'] = value.reverse();
          smaJSON['SMAindTitle'] = indTitle;
          smaJSON['Symbol'] = symbol;
          smaJSON['timeArr'] = timeArr.reverse();

          res.setHeader("Access-Control-Allow-Origin", "*"); 
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify(smaJSON));
          console.log('sma');
          }
          catch (err) {
            res.write('failed');
            console.log('TRYCATCHSUCCESS');
          }
          res.end();
      }



// EMA
      if (todo == 'EMA') {
          var urlEMA = 'https://www.alphavantage.co/query?function=EMA&symbol='+company+'&interval=daily&time_period=10&series_type=close&apikey=TK9IT11RQ6G0AM0N';
          try {
          var resq = request('GET', urlEMA);
          var json = JSON.parse(resq.getBody('utf8'));
          var emaJSON = {};
          var timeArr = new Array();
          var lastDate = json["Meta Data"]["3: Last Refreshed"];
          var indTitle = json["Meta Data"]["2: Indicator"];
          var symbol = json["Meta Data"]["1: Symbol"];
          var value = []; 
          var count = 0;
          var techAnalysis = "Technical Analysis: " + "EMA";
          for (var key in json[techAnalysis]) {
            timeArr.push(key.substring(5,7)+'/'+key.substring(8,10));
              value.push(parseFloat(json[techAnalysis][key]["EMA"]));
              count += 1;
              if (( ((new Date(lastDate)).getTime()/1000 - (new Date(key)).getTime()/1000) >= 174*24*60*60) && (count % 7 == 0)) {
                  break;
              }
          } 
          emaJSON['EMAvalue'] = value.reverse();
          emaJSON['EMAindTitle'] = indTitle;
          emaJSON['Symbol'] = symbol;
          emaJSON['timeArr'] = timeArr.reverse();

          res.setHeader("Access-Control-Allow-Origin", "*"); 
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify(emaJSON));
          console.log('ema');
          }
          catch (err) {
            res.write('failed');
            console.log('TRYCATCHSUCCESS');
          }
          res.end();
      }

// RSI
      if (todo == 'RSI') {
          var urlRSI = 'https://www.alphavantage.co/query?function=RSI&symbol='+company+'&interval=daily&time_period=10&series_type=close&apikey=TK9IT11RQ6G0AM0N';
          try {
          var resq = request('GET', urlRSI);
          var json = JSON.parse(resq.getBody('utf8'));
          var rsiJSON = {};
          var timeArr = new Array();

          var lastDate = json["Meta Data"]["3: Last Refreshed"];
          var indTitle = json["Meta Data"]["2: Indicator"];
          var symbol = json["Meta Data"]["1: Symbol"];
          var value = []; 
          var count = 0;
          var techAnalysis = "Technical Analysis: " + "RSI";
          for (var key in json[techAnalysis]) {
            timeArr.push(key.substring(5,7)+'/'+key.substring(8,10));
              value.push(parseFloat(json[techAnalysis][key]["RSI"]));
              count += 1;
              if (( ((new Date(lastDate)).getTime()/1000 - (new Date(key)).getTime()/1000) >= 174*24*60*60) && (count % 7 == 0)) {
                  break;
              }
          }
          rsiJSON['RSIvalue'] = value.reverse();
          rsiJSON['RSIindTitle'] = indTitle;
          rsiJSON['Symbol'] = symbol;
          rsiJSON['timeArr'] = timeArr.reverse();

          res.setHeader("Access-Control-Allow-Origin", "*"); 
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify(rsiJSON));
          console.log('rsi');
          }
          catch (err) {
            res.write('failed');
            console.log('TRYCATCHSUCCESS');
          }
          res.end();
      }

// CCI
      if (todo == 'CCI') {
          var urlCCI = 'https://www.alphavantage.co/query?function=CCI&symbol='+company+'&interval=daily&time_period=10&series_type=close&apikey=TK9IT11RQ6G0AM0N';
          try {
          var resq = request('GET', urlCCI);
          var json = JSON.parse(resq.getBody('utf8'));
          var cciJSON = {};
          var timeArr = new Array();

          var lastDate = json["Meta Data"]["3: Last Refreshed"];
          var indTitle = json["Meta Data"]["2: Indicator"];
          var symbol = json["Meta Data"]["1: Symbol"];
          var value = []; 
          var count = 0;
          var techAnalysis = "Technical Analysis: " + "CCI";
          for (var key in json[techAnalysis]) {
            timeArr.push(key.substring(5,7)+'/'+key.substring(8,10));
              value.push(parseFloat(json[techAnalysis][key]["CCI"]));
              count += 1;
              if (( ((new Date(lastDate)).getTime()/1000 - (new Date(key)).getTime()/1000) >= 174*24*60*60) && (count % 7 == 0)) {
                  break;
              }
          } 
          cciJSON['CCIvalue'] = value.reverse();
          cciJSON['CCIindTitle'] = indTitle;
          cciJSON['Symbol'] = symbol;
          cciJSON['timeArr'] = timeArr.reverse();

          res.setHeader("Access-Control-Allow-Origin", "*"); 
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify(cciJSON));
          console.log('cci');
          }
          catch (err) {
            res.write('failed');
            console.log('TRYCATCHSUCCESS');
          }
          res.end();
      }

// ADX
      if (todo == 'ADX') {
          var urlADX = 'https://www.alphavantage.co/query?function=ADX&symbol='+company+'&interval=daily&time_period=10&series_type=close&apikey=TK9IT11RQ6G0AM0N';
          try {
          var resq = request('GET', urlADX);
          var json = JSON.parse(resq.getBody('utf8'));
          var adxJSON = {};
          var timeArr = new Array();

          var lastDate = json["Meta Data"]["3: Last Refreshed"];
          var indTitle = json["Meta Data"]["2: Indicator"];
          var symbol = json["Meta Data"]["1: Symbol"];
          var value = []; 
          var count = 0;
          var techAnalysis = "Technical Analysis: " + "ADX";
          for (var key in json[techAnalysis]) {
            timeArr.push(key.substring(5,7)+'/'+key.substring(8,10));
              value.push(parseFloat(json[techAnalysis][key]["ADX"]));
              count += 1;
              if (( ((new Date(lastDate)).getTime()/1000 - (new Date(key)).getTime()/1000) >= 174*24*60*60) && (count % 7 == 0)) {
                  break;
              }
          } 
          adxJSON['ADXvalue'] = value.reverse();
          adxJSON['ADXindTitle'] = indTitle;
          adxJSON['Symbol'] = symbol;
          adxJSON['timeArr'] = timeArr.reverse();

          res.setHeader("Access-Control-Allow-Origin", "*"); 
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify(adxJSON));
          console.log('adx');
          }
          catch (err) {
            res.write('failed');
            console.log('TRYCATCHSUCCESS');
          }
          res.end();
      }

// STOCH
      if (todo == 'STOCH') {
          var urlSTOCH = 'https://www.alphavantage.co/query?function=STOCH&symbol='+company+'&interval=daily&time_period=10&slowkmatype=1&slowdmatype=1&series_type=close&apikey=TK9IT11RQ6G0AM0N';
          try {
          var resq = request('GET', urlSTOCH);
          var json = JSON.parse(resq.getBody('utf8'));
          var stochJSON = {};
          var timeArr = new Array();

          var lastDate = json["Meta Data"]["3: Last Refreshed"];
          var indTitle = json["Meta Data"]["2: Indicator"];
          var symbol = json["Meta Data"]["1: Symbol"];
          var valueD = []; 
          var valueK = [];
          var count = 0;
          var techAnalysis = "Technical Analysis: " + "STOCH";
          for (var key in json[techAnalysis]) {
            timeArr.push(key.substring(5,7)+'/'+key.substring(8,10));
              valueD.push(parseFloat(json[techAnalysis][key]["SlowD"]));
              valueK.push(parseFloat(json[techAnalysis][key]["SlowK"]));
              count += 1;
              if (( ((new Date(lastDate)).getTime()/1000 - (new Date(key)).getTime()/1000) >= 174*24*60*60) && (count % 7 == 0)) {
                  break;
              }
          } 
          stochJSON['STOCHvalueD'] = valueD.reverse();
          stochJSON['STOCHvalueK'] = valueK.reverse();
          stochJSON['STOCHindTitle'] = indTitle;
          stochJSON['Symbol'] = symbol;
          stochJSON['timeArr'] = timeArr.reverse();

          res.setHeader("Access-Control-Allow-Origin", "*"); 
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify(stochJSON));
          console.log('stoch');
          }
          catch (err) {
            res.write('failed');
            console.log('TRYCATCHSUCCESS');
          }
          res.end();
      }

// BBANDS
      if (todo == 'BBANDS') {
          var urlBBANDS = 'https://www.alphavantage.co/query?function=BBANDS&symbol='+company+'&interval=daily&time_period=5&series_type=close&nbdevup=3&nbdevdn=3&apikey=TK9IT11RQ6G0AM0N';
          try {
          var resq = request('GET', urlBBANDS);
          var json = JSON.parse(resq.getBody('utf8'));
          var bbandsJSON = {};
          var timeArr = new Array();

          var lastDate = json["Meta Data"]["3: Last Refreshed"];
          var indTitle = json["Meta Data"]["2: Indicator"];
          var symbol = json["Meta Data"]["1: Symbol"];
          var valueLow = []; 
          var valueUp = [];
          var valueMid = [];
          var count = 0;
          var techAnalysis = "Technical Analysis: " + "BBANDS";
          for (var key in json[techAnalysis]) {
            timeArr.push(key.substring(5,7)+'/'+key.substring(8,10));
              valueLow.push(parseFloat(json[techAnalysis][key]["Real Lower Band"]));
              valueUp.push(parseFloat(json[techAnalysis][key]["Real Upper Band"]));
              valueMid.push(parseFloat(json[techAnalysis][key]["Real Middle Band"]));
              count += 1;
              if (( ((new Date(lastDate)).getTime()/1000 - (new Date(key)).getTime()/1000) >= 174*24*60*60) && (count % 7 == 0)) {
                  break;
              }
          } 
          bbandsJSON['BBANDSvalueLow'] = valueLow.reverse();
          bbandsJSON['BBANDSvalueUp'] = valueUp.reverse();
          bbandsJSON['BBANDSvalueMid'] = valueMid.reverse();
          bbandsJSON['BBANDSindTitle'] = indTitle;
          bbandsJSON['Symbol'] = symbol;
          bbandsJSON['timeArr'] = timeArr.reverse();

          res.setHeader("Access-Control-Allow-Origin", "*"); 
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify(bbandsJSON));
          console.log('bbands');
          }
          catch (err) {
            res.write('failed');
            console.log('TRYCATCHSUCCESS');
          }
          res.end();
      }

// MACD
      if (todo == 'MACD') {
          var urlMACD = 'https://www.alphavantage.co/query?function=MACD&symbol='+company+'&interval=daily&time_period=10&series_type=close&apikey=TK9IT11RQ6G0AM0N';
          try {
          var resq = request('GET', urlMACD);
          var json = JSON.parse(resq.getBody('utf8'));
          var macdJSON = {};
          var timeArr = new Array();

          var lastDate = json["Meta Data"]["3: Last Refreshed"];
          var indTitle = json["Meta Data"]["2: Indicator"];
          var symbol = json["Meta Data"]["1: Symbol"];
          var valueSig = []; 
          var valueHist = [];
          var valueMacd = [];
          var count = 0;
          var techAnalysis = "Technical Analysis: " + "MACD";
          for (var key in json[techAnalysis]) {
            timeArr.push(key.substring(5,7)+'/'+key.substring(8,10));
              valueSig.push(parseFloat(json[techAnalysis][key]["MACD_Signal"]));
              valueHist.push(parseFloat(json[techAnalysis][key]["MACD_Hist"]));
              valueMacd.push(parseFloat(json[techAnalysis][key]["MACD"]));
              count += 1;
              if (( ((new Date(lastDate)).getTime()/1000 - (new Date(key)).getTime()/1000) >= 174*24*60*60) && (count % 7 == 0)) {
                  break;
              }
          } 
          macdJSON['MACDvalueSig'] = valueSig.reverse();
          macdJSON['MACDvalueHist'] = valueHist.reverse();
          macdJSON['MACDvalueMacd'] = valueMacd.reverse();
          macdJSON['MACDindTitle'] = indTitle;
          macdJSON['Symbol'] = symbol;
          macdJSON['timeArr'] = timeArr.reverse();

          res.setHeader("Access-Control-Allow-Origin", "*"); 
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify(macdJSON));
          console.log('macd');
          }
          catch (err) {
            res.write('failed');
            console.log('TRYCATCHSUCCESS');
          }
          res.end();
      }



// highStock
      if (todo == 'highStock') {
          var url = 'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol='+company+'&outputsize=full&apikey=TK9IT11RQ6G0AM0N';
          try {
          var resq = request('GET', url);
          var json = JSON.parse(resq.getBody('utf8'));
          var highStockJSON = {};

          var title = json['Meta Data']["2. Symbol"].toUpperCase() + ' Stock Value';
          var symbol = json["Meta Data"]["2. Symbol"].toUpperCase();
          var Arr = new Array();
          var count = 0;
          for (var key in json["Time Series (Daily)"]) {
              Arr.push([(new Date(key)).getTime(), parseFloat(json["Time Series (Daily)"][key]["4. close"])]);
              count += 1;
              if (count >= 1000) {
                  break;
              }
          }
          highStockJSON['title'] = title;
          highStockJSON['Arr'] = Arr.reverse();
          highStockJSON['Symbol'] = symbol;

          res.setHeader("Access-Control-Allow-Origin", "*"); 
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify(highStockJSON));
          console.log('highstock');
          }
          catch (err) {
            res.write('failed');
            console.log('TRYCATCHSUCCESS');
          }
          res.end();
      }

// NEWS
      if (todo == 'NEWS') {
          var urlNEWS = 'https://seekingalpha.com/api/sa/combined/'+company+'.xml';
          try {
          var resq = request('GET', urlNEWS);
          var xml = resq.getBody('utf8');
          var parser = new xml2js.Parser(); 
          var newsJSON = {};

          parser.parseString(xml, function (err, json) {
              var newsTitleArr = new Array();
              var newsURLArr = new Array();
              var newsTimeArr = new Array();
              var newsAuthorArr = new Array();
              var count = 1;
              for (var index = 0; index < json['rss']['channel'][0]['item'].length; index++) {
                  if ((json['rss']['channel'][0]['item'][index]['link'][0]).includes('article')) {
                      newsTitleArr.push(json['rss']['channel'][0]['item'][index]['title'][0]);
                      newsURLArr.push(json['rss']['channel'][0]['item'][index]['link'][0]);
                      newsTimeArr.push((json['rss']['channel'][0]['item'][index]['pubDate'][0]).substring(0, 26) + "EDT");
                      newsAuthorArr.push(json['rss']['channel'][0]['item'][index]['sa:author_name'][0]);
                      if (count >= 5) {
                        break;
                      }
                      count++;
                  }
              }
              newsJSON['newsTitleArr'] = newsTitleArr.reverse();
              newsJSON['newsURLArr'] = newsURLArr.reverse();
              newsJSON['newsTimeArr'] = newsTimeArr.reverse();
              newsJSON['newsAuthorArr']= newsAuthorArr.reverse();
          });

          res.setHeader("Access-Control-Allow-Origin", "*"); 
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.write(JSON.stringify(newsJSON));
          console.log('news');
          }
          catch (err) {
            res.write('failed');
            console.log('TRYCATCHSUCCESS');
          }
          res.end();
      }
});
var myport = 3000;
sever.listen(process.env.PORT || myport);
