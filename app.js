var request = require("request");
const fs = require('fs');

var new_json_final; //Variavel que vai receber o JSON novo para efetuar o post no Zoho
var new_key; //Variavel que vai receber o novo token para ser usado no Zoho
var path = "./data.json"; //Caminho do json para posterior delete

/*** ZOHO */
var refresh_token = 'x';
var client_id = 'x';
var secret_id = 'x';

/*** GetResponse */
var api_key = 'api-key x';
var dateObj = new Date();
var month = dateObj.getUTCMonth() + 1; //months from 1-12
var day = dateObj.getUTCDate() - 1; //Pegar o dia anterior
var year = dateObj.getUTCFullYear();

async function getResponseJson() {
    //Efetua request no GetResponse para obter o json de informacoes e jogar para o Zoho

    if(month.toString().length < 2){
        month = "0" + month;
    }

    if(day.toString().length < 2){
        day = "0" + day;
    }

    var date_time_get = year + "-" + month + "-" + day;//Pega a data a partir do dia anterior para verificar novas leads

    console.log(date_time_get);
    const options = {
        url: `https://api.getresponse.com/v3/contacts?fields=name,email&query[createdOn][from]=${date_time_get}`,
        method: 'GET',
        headers: {
            'X-Auth-Token': `${api_key}`
        },
        json: true
    }

    request(options, function (error, response, body) {
        if (error) { console.log(error); }
        else {
            let data = body;

            data.map((item) => {
                item['Last_Name'] = item.name;
                item['Email'] = item.email;
                delete item.contactId;
                delete item.name;
                delete item.email;
            });

            let json = JSON.stringify(data);
            var after_first = json.substring(json.indexOf("{"));
            new_json_final = '{"data":[' + after_first + ',"trigger": ["approval","workflow","blueprint"]}';
            console.log(new_json_final);
            fs.writeFile('data.json', new_json_final, function (err) {
                if (err)
                    throw err;
            });
        }
    });
}

async function makeNewZohoToken() {
    //Efetua request para troca do token de acesso no Zoho
    const zoho_options = {
        url: `https://accounts.zoho.com/oauth/v2/token?refresh_token=${refresh_token}&client_id=${client_id}&client_secret=${secret_id}&grant_type=refresh_token`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        json: true
    }

    request(zoho_options, function (error, response, body) {
        if (error) { console.log(error); }
        else {
            new_key = body.access_token;
            console.log(new_key);
        }
    });
}

async function makeZohoPost() {
    //Efetua request para post dos contatos no Zoho
    
    if(new_json_final.length <= 59){
        console.log("Sem informacoes a serem upadas..");
    } else{
        const config = require("./data.json");

        const zoho_options_post = {
            url: 'https://www.zohoapis.com/crm/v2/Contacts',
            method: 'POST',
            headers: {
                'Authorization': 'Zoho-oauthtoken ' + `${new_key}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: config, 
            json: true
        }

        request(zoho_options_post, function (error, response, body) {
            if (error) { console.log(error); }
            else {
                console.log(body);
            }
        });
    }
}

async function deleteJson() {
    try {
        fs.unlinkSync(path)
        console.log("Json deletado")
      } catch(err) {
        console.error(err)
      }
}

async function main() {
    let res = await getResponseJson();
    setTimeout(makeNewZohoToken, 5000);
    setTimeout(makeZohoPost, 10000);
    setTimeout(deleteJson, 20000);
}

main()