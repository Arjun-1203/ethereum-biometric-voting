import smtplib
import mysql.connector
from flask_cors import CORS
from flask import *
from solcx import compile_standard, install_solc
from web3 import Web3
# from web3.middleware import geth_poa_middleware
# from web3.middleware import geth_poa_middleware
from web3.middleware.geth_poa import geth_poa_middleware
import sqlite3
app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'


def output(y):

    pass


def sendmail(e, msg):
    mail = smtplib.SMTP('smtp.gmail.com', 587)  # host and port area
    # Hostname to send for this command defaults to the FQDN of the local host.
    mail.ehlo()
    mail.starttls()  # security connection
    mail.login('arjun12122003@gmail.com', 'xoquxejecfkwnsnw')  # login part
    mail.sendmail('arjun12122003@gmail.com',
                  e, msg)  # send part
    print("Congrats! Your mail has been sent.")


def smartetherum(e):

    import json
    install_solc("0.6.0")
    with open("./SimpleStorage.sol", "r") as file:
        simple_storage_file = file.read()

    compiled_sol = compile_standard(
        {
            "language": "Solidity",
            "sources": {"SimpleStorage.sol": {"content": simple_storage_file}},
            "settings": {
                "outputSelection": {
                    "*": {
                        "*": ["abi", "metadata", "evm.bytecode", "evm.bytecode.sourceMap"]
                    }
                }
            },
        },
        solc_version="0.6.0",
    )

    with open("compiled_code.json", "w") as file:
        json.dump(compiled_sol, file)

    bytecode = compiled_sol["contracts"]["SimpleStorage.sol"]["SimpleStorage"]["evm"][
        "bytecode"
    ]["object"]
    # get abi
    abi = json.loads(
        compiled_sol["contracts"]["SimpleStorage.sol"]["SimpleStorage"]["metadata"]
    )["output"]["abi"]

    w3 = Web3(Web3.HTTPProvider('HTTP://127.0.0.1:7545'))
    chain_id = 1337
    print(w3.is_connected())
    my_address = e[0]
    private_key = e[1]
    # initialize contract
    SimpleStorage = w3.eth.contract(abi=abi, bytecode=bytecode)
    nonce = w3.eth.get_transaction_count(my_address)
    # set up transaction from constructor which executes when firstly
    transaction = SimpleStorage.constructor().build_transaction(
        {"chainId": chain_id, "from": my_address, "nonce": nonce}
    )
    signed_tx = w3.eth.account.sign_transaction(
        transaction, private_key=private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
    tx_receipt = "".join(["{:02X}".format(b)
                         for b in tx_receipt["transactionHash"]])
    print("Transacation completed")
    return tx_receipt


def smartbinance(e):
    print(e)
    address, privatekey = e
    import json
    conn = connect()
    cursor = conn.cursor()
    install_solc("0.6.0")
    with open("./SimpleStorage.sol", "r") as file:
        simple_storage_file = file.read()

    compiled_sol = compile_standard(
        {
            "language": "Solidity",
            "sources": {"SimpleStorage.sol": {"content": simple_storage_file}},
            "settings": {
                "outputSelection": {
                    "*": {
                        "*": ["abi", "metadata", "evm.bytecode", "evm.bytecode.sourceMap"]
                    }
                }
            },
        },
        solc_version="0.6.0",
    )

    with open("compiled_code.json", "w") as file:
        json.dump(compiled_sol, file)

    bytecode = compiled_sol["contracts"]["SimpleStorage.sol"]["SimpleStorage"]["evm"][
        "bytecode"
    ]["object"]
    # get abi
    abi = json.loads(
        compiled_sol["contracts"]["SimpleStorage.sol"]["SimpleStorage"]["metadata"]
    )["output"]["abi"]
    from web3 import Web3
    import json

    # w3 = Web3(Web3.HTTPProvider('HTTP://127.0.0.1:7545'))
    chain_id = 97
    # print(w3.is_connected())
    # BSC Testnet RPC URL
    bsc_testnet_rpc_url = "https://data-seed-prebsc-1-s1.binance.org:8545/"

    # Connect to BSC Testnet
    w3 = Web3(Web3.HTTPProvider(bsc_testnet_rpc_url))
    # web3.middleware_stack.inject(geth_poa_middleware, layer=0)
    w3.middleware_onion.inject(geth_poa_middleware, layer=0)
    my_address = address
    private_key = privatekey
    # initialize contract
    SimpleStorage = w3.eth.contract(abi=abi, bytecode=bytecode)
    nonce = w3.eth.get_transaction_count(my_address)
    # set up transaction from constructor which executes when firstly
    transaction = SimpleStorage.constructor().build_transaction(
        {"chainId": chain_id, "from": my_address, "nonce": nonce}
    )
    signed_tx = w3.eth.account.sign_transaction(
        transaction, private_key=private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)

    tx_receipt = "".join(["{:02X}".format(b)
                         for b in tx_receipt["transactionHash"]])
    print(tx_receipt)
    print("Transacation completed")
    return tx_receipt


def connect():
    # return sqlite3.connect("evoting.db")
    return mysql.connector.connect(host="localhost", user="root",  password="",  database="evoting", auth_plugin='mysql_native_password', port="3306")


@app.route('/evoting/insertcastvote', methods=["POST"], strict_slashes=False)
def insertcastvote():
    r = request.json
    print(r)
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "select nomitationID from electionnomitation where voterid='%s' and electionid='%s';" % (
        r["contestantid"], r["electionid"])
    mycursor.execute(tx)
    nominateid = mycursor.fetchone()[0]
    mycursor = mydb.cursor()
    tx = "select castid from castvote order by castid desc limit 1"
    mycursor.execute(tx)
    try:
        e = mycursor.fetchall()
    except:
        pass
    if len(e) == 0:
        eid = 1
    else:
        eid = e[0][0]+1
    tx = "select Account,privatekey  from votermaster where voteid='%s'" % (
        r["voterid"])
    mycursor.execute(tx)
    e = mycursor.fetchone()
    # tx_receipt=smartetherum(e)
    tx_receipt = smartbinance(e)

    d = "insert into castvote(castid,nomitationID,voterid,blockchaingenerated,electionid)values ('%s','%s','%s','%s','%s')" % (
        eid, nominateid, r['voterid'], tx_receipt, r["electionid"])
    mycursor = mydb.cursor()
    mycursor.execute(d)
    mydb.commit()
    mydb.close()
    # output("vote casted successfully")
    return 'e'


@app.route('/evoting/updatecastvote', methods=["POST"], strict_slashes=False)
def updatecastvote():
    r = request.json
    mydb = connect()
    d = "update castvote set nomitationID ='%s',voterid ='%s',blockchaingenerated ='%s' where castid='%s'" % (
        r['nomitationID'], r['voterid'], r['blockchaingenerated'], r['castid'])
    mycursor = mydb.cursor()
    mycursor.execute(d)
    mydb.commit()
    mydb.close()
    return 's'


@app.route('/evoting/viewcastvote', methods=["POST"], strict_slashes=False)
def viewcastvote():
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "select *   from castvote"
    mycursor.execute(tx)
    e = mycursor.fetchall()
    mydb.close()
    return json.dumps(e)


@app.route('/evoting/deletecastvote', methods=["POST"], strict_slashes=False)
def deletecastvote():
    r = request.json
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "delete from castvote where castid={0}".format(r['id'])
    mycursor.execute(tx)
    mydb.commit()
    mydb.close()
    return 's'


@app.route('/evoting/insertconstituencymaster', methods=["POST"], strict_slashes=False)
def insertconstituencymaster():
    r = request.json
    mydb = connect()
    mycursor = mydb.cursor()
    tx = 'select constituencyID from constituencymaster order by constituencyID desc limit 1'
    mycursor.execute(tx)
    e = mycursor.fetchall()
    if len(e) == 0:
        eid = 1
    else:
        eid = e[0][0]+1
    d = "insert into constituencymaster(constituencyID,constituencyName,state)values ('%s','%s','%s')" % (
        eid, r['constituencyName'], r['state'])
    mycursor = mydb.cursor()
    mycursor.execute(d)
    mydb.commit()
    mydb.close()
    return 'e'


@app.route('/evoting/updateconstituencymaster', methods=["POST"], strict_slashes=False)
def updateconstituencymaster():
    r = request.json
    mydb = connect()
    d = "update constituencymaster set constituencyName ='%s',state ='%s' where constituencyID='%s'" % (
        r['constituencyName'], r['state'], r['constituencyID'])
    mycursor = mydb.cursor()
    mycursor.execute(d)
    mydb.commit()
    mydb.close()
    return 's'


@app.route('/evoting/viewconstituencymaster', methods=["POST"], strict_slashes=False)
def viewconstituencymaster():
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "select *   from constituencymaster"
    mycursor.execute(tx)
    e = mycursor.fetchall()
    mydb.close()
    return json.dumps(e)


@app.route('/evoting/deleteconstituencymaster', methods=["POST"], strict_slashes=False)
def deleteconstituencymaster():
    r = request.json
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "delete from constituencymaster where constituencyID={0}".format(
        r['id'])
    mycursor.execute(tx)
    mydb.commit()
    mydb.close()
    return 's'


@app.route('/evoting/insertelectiondetails', methods=["POST"], strict_slashes=False)
def insertelectiondetails():
    r = request.json
    mydb = connect()
    mycursor = mydb.cursor()
    tx = 'select electionID from electiondetails order by electionID desc limit 1'
    mycursor.execute(tx)
    e = mycursor.fetchall()
    if len(e) == 0:
        eid = 1
    else:
        eid = e[0][0]+1
    d = "insert into electiondetails(electionID,electionName,nominationLastDate,effDate,resultdate,status)values ('%s','%s','%s','%s','%s','%s')" % (
        eid, r['electionName'], r['nominationLastDate'], r['effDate'], r['resultdate'], 'started')
    mycursor = mydb.cursor()
    mycursor.execute(d)
    mydb.commit()
    mydb.close()
    return 'e'


@app.route('/evoting/updateelectiondetails', methods=["POST"], strict_slashes=False)
def updateelectiondetails():
    r = request.json
    mydb = connect()
    d = "update electiondetails set electionName ='%s',nominationLastDate ='%s',effDate ='%s',resultdate ='%s' where electionID='%s'" % (
        r['electionName'], r['nominationLastDate'], r['effDate'], r['resultdate'], r['electionID'])
    mycursor = mydb.cursor()
    mycursor.execute(d)
    mydb.commit()
    mydb.close()
    return 's'


@app.route('/evoting/viewelectiondetails', methods=["POST"], strict_slashes=False)
def viewelectiondetails():
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "select *   from electiondetails"
    mycursor.execute(tx)
    e = mycursor.fetchall()
    mydb.close()
    return json.dumps(e)


@app.route('/evoting/viewelectiondavaiable', methods=["POST"], strict_slashes=False)
def viewelectiondavaiable():
    r = request.json
    print(r)
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "select * from electiondetails where  nominationLastDate>=CURRENT_DATE() and status!='ended'"
    mycursor.execute(tx)
    e = mycursor.fetchall()
    l = []
    for k in e:
        k = list(k)
        mycursor = mydb.cursor()
        tx = "select count(*) from electionnomitation where voterID='%s' and electionID='%s'" % (
            r["voterid"], k[0])
        print(tx)
        mycursor.execute(tx)
        r = mycursor.fetchone()
        if (r[0] == 1):
            k[-1] = "nominated"
        else:
            k[-1] = "no nominated"
        l.append(k)
    mydb.close()
    return json.dumps(l)


@app.route('/evoting/viewvoteavaiable', methods=["POST"], strict_slashes=False)
def viewvoteavaiable():
    r = request.json
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "SELECT * from electiondetails WHERE effDate=CURRENT_DATE() and status!='ended';"
    mycursor.execute(tx)
    e = mycursor.fetchall()
    l = []
    for k in e:
        k = list(k)
        mycursor = mydb.cursor()
        tx = "select count(*) from castvote where voterID='%s' and electionID='%s'" % (
            r["voterid"], k[0])
        mycursor.execute(tx)
        r = mycursor.fetchone()
        if (r[0] == 1):
            k[-1] = "voted"
        else:
            k[-1] = "not voted"
        l.append(k)
    print(l)
    mydb.close()
    return json.dumps(l)


@app.route('/evoting/getcastvote', methods=["POST"], strict_slashes=False)
def getcastvote():
    r = request.json
    mydb = connect()
    mycursor = mydb.cursor()
    print(r)
    out = {}
    tx = "select * from constituencymaster where constituencyID=(select constituencyID from votermaster where voteid='%s');" % (
        r["voterid"])
    mycursor.execute(tx)
    e = mycursor.fetchone()
    print(e)
    out["constituency"] = e
    tx = "select p.politicalPartyName,v.firstName,v.voteID,p.image from politicalpartymaster p join electionnomitation e on e.politicalpartyid=p.politicalpartyid join votermaster v on v.voteid=e.voterid join electiondetails ex where e.electionid='%s'and ex.status!='ended';" % (
        r["electionid"])
    print(tx)
    mycursor.execute(tx)
    e = mycursor.fetchall()
    out["political"] = e
    mydb.close()
    print(out)
    return json.dumps(out)


@app.route('/evoting/getnomination', methods=["POST"], strict_slashes=False)
def getnomination():
    out = {}
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "select *   from politicalpartymaster"
    mycursor.execute(tx)
    e = mycursor.fetchall()
    out["political"] = e

    tx = "select *   from constituencymaster"
    mycursor.execute(tx)
    e = mycursor.fetchall()
    out["constituency"] = e
    mydb.close()
    return json.dumps(out)


@app.route('/evoting/withdrawnomination', methods=["POST"], strict_slashes=False)
def withdrawnomination():
    r = request.json
    print(r)
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "delete from electionnomitation where voterId={0} and electionid={1}".format(
        r['voterid'], r["eid"])
    mycursor.execute(tx)
    mydb.commit()
    mydb.close()
    return 's'


@app.route('/evoting/deleteelectiondetails', methods=["POST"], strict_slashes=False)
def deleteelectiondetails():
    r = request.json
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "delete from electiondetails where electionID={0}".format(r['id'])
    mycursor.execute(tx)
    mydb.commit()
    mydb.close()
    return 's'


@app.route('/evoting/insertelectionnomitation', methods=["POST"], strict_slashes=False)
def insertelectionnomitation():
    r = request.json
    mydb = connect()
    mycursor = mydb.cursor()
    tx = 'select nomitationID from electionnomitation order by nomitationID desc limit 1'
    mycursor.execute(tx)
    e = mycursor.fetchall()
    if len(e) == 0:
        eid = 1
    else:
        eid = e[0][0]+1
    d = "insert into electionnomitation(nomitationID,voterID,politicalPartyID,electionID,constituencyID)values ('%s','%s','%s','%s','%s')" % (
        eid, r['voterID'], r['politicalPartyID'], r['electionID'], r['constituencyID'])
    mycursor = mydb.cursor()
    mycursor.execute(d)
    mydb.commit()
    mydb.close()
    return 'e'


@app.route('/evoting/updateelectionnomitation', methods=["POST"], strict_slashes=False)
def updateelectionnomitation():
    r = request.json
    mydb = connect()
    d = "update electionnomitation set voterID ='%s',politicalPartyID ='%s',electionID ='%s',constituencyID ='%s' where nomitationID='%s'" % (
        r['voterID'], r['politicalPartyID'], r['electionID'], r['constituencyID'], r['nomitationID'])
    mycursor = mydb.cursor()
    mycursor.execute(d)
    mydb.commit()
    mydb.close()
    return 's'


@app.route('/evoting/viewelectionnomitation', methods=["POST"], strict_slashes=False)
def viewelectionnomitation():
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "select *   from electionnomitation"
    mycursor.execute(tx)
    e = mycursor.fetchall()
    mydb.close()
    return json.dumps(e)


@app.route('/evoting/deleteelectionnomitation', methods=["POST"], strict_slashes=False)
def deleteelectionnomitation():
    r = request.json
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "delete from electionnomitation where nomitationID={0}".format(
        r['id'])
    mycursor.execute(tx)
    mydb.commit()
    mydb.close()
    return 's'


@app.route('/evoting/insertpoliticalpartymaster', methods=["POST"], strict_slashes=False)
def insertpoliticalpartymaster():
    r = request.json
    mydb = connect()
    mycursor = mydb.cursor()
    tx = 'select politicalPartyID from politicalpartymaster order by politicalPartyID desc limit 1'
    mycursor.execute(tx)
    e = mycursor.fetchall()
    if len(e) == 0:
        eid = 1
    else:
        eid = e[0][0]+1
    d = "insert into politicalpartymaster(politicalPartyID,politicalPartyName,image)values ('%s','%s','%s')" % (
        eid, r['politicalPartyName'], r["imageName"])
    mycursor = mydb.cursor()
    mycursor.execute(d)
    mydb.commit()
    mydb.close()
    return 'e'


@app.route('/evoting/updatepoliticalpartymaster', methods=["POST"], strict_slashes=False)
def updatepoliticalpartymaster():
    r = request.json
    mydb = connect()
    d = "update politicalpartymaster set politicalPartyName ='%s' where politicalPartyID='%s'" % (
        r['politicalPartyName'], r['politicalPartyID'])
    mycursor = mydb.cursor()
    mycursor.execute(d)
    mydb.commit()
    mydb.close()
    return 's'


@app.route('/evoting/viewpoliticalpartymaster', methods=["POST"], strict_slashes=False)
def viewpoliticalpartymaster():
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "select *   from politicalpartymaster"
    mycursor.execute(tx)
    e = mycursor.fetchall()
    mydb.close()
    return json.dumps(e)


@app.route('/evoting/deletepoliticalpartymaster', methods=["POST"], strict_slashes=False)
def deletepoliticalpartymaster():
    r = request.json
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "delete from politicalpartymaster where politicalPartyID={0}".format(
        r['id'])
    mycursor.execute(tx)
    mydb.commit()
    mydb.close()
    return 's'


@app.route('/evoting/upload', methods=['POST'])
def success():
    if request.method == 'POST':
        f = request.files['file']
        f.save("static/"+f.filename)
        return 's'


@app.route('/evoting/insertvotermaster', methods=["POST"], strict_slashes=False)
def insertvotermaster():
    r = request.json

    mydb = connect()
    mycursor = mydb.cursor()
    tx = 'select voteID from votermaster order by voteID desc limit 1'
    mycursor.execute(tx)
    e = mycursor.fetchall()
    if len(e) == 0:
        eid = 1
    else:
        eid = e[0][0]+1
    d = "insert into votermaster(voteID,title,firstName,middleName,lastName,streetName,area,city,district,state,dob,addressProof,ageProof,constituencyID,isApproved,mobileNbr,emailID,password,gender,Account,privatekey)values ('%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s','%s')" % (
        eid, r['title'], r['firstName'], r['middleName'], r['lastName'], r['streetName'], r['area'], r['city'], r['district'], r['state'], r['dob'], r['addressProof'], r['ageProof'], r['constituencyID'], r['isApproved'], r['mobileNbr'], r['emailID'], r['password'], r['gender'], r['Account'], r['privatekey'])
    mycursor = mydb.cursor()
    mycursor.execute(d)
    mydb.commit()

    return 'e'


@app.route('/evoting/updatevotermaster', methods=["POST"], strict_slashes=False)
def updatevotermaster():
    r = request.json
    mydb = connect()
    d = "update votermaster set title ='%s',firstName ='%s',middleName ='%s',lastName ='%s',streetName ='%s',area ='%s',city ='%s',district ='%s',state ='%s',dob ='%s',addressProof ='%s',ageProof ='%s',constituencyID ='%s',isApproved ='%s',mobileNbr ='%s',emailID ='%s',password ='%s',gender ='%s',Account ='%s',privatekey ='%s' where voteID='%s'" % (
        r['title'], r['firstName'], r['middleName'], r['lastName'], r['streetName'], r['area'], r['city'], r['district'], r['state'], r['dob'], r['addressProof'], r['ageProof'], r['constituencyID'], r['isApproved'], r['mobileNbr'], r['emailID'], r['password'], r['gender'], r['Account'], r['privatekey'], r['voteID'])
    mycursor = mydb.cursor()
    mycursor.execute(d)
    mydb.commit()
    mydb.close()
    return 's'


@app.route('/evoting/approvevotermaster', methods=["POST"], strict_slashes=False)
def approvevotermaster():
    r = request.json
    mydb = connect()
    d = "update votermaster set isApproved='%s',account='%s',privatekey='%s' where voteid='%s'" % (
        r["isApproved"], r['account'], r['privatekey'], r["voteID"])
    mycursor = mydb.cursor()
    mycursor.execute(d)
    smartbinance([r['account'], r['privatekey']])
    print("block chain started")
    sendmail(r["emailID"], "Your voter registration has been approved. You can now login to cast your vote in upcoming elections.")
    mydb.commit()
    mydb.close()
    # output("voter Approved successfully")
    return 's'


@app.route('/evoting/viewvotermaster', methods=["POST"], strict_slashes=False)
def viewvotermaster():
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "select *   from votermaster where isApproved=0"
    mycursor.execute(tx)
    e = mycursor.fetchall()
    mydb.close()
    return json.dumps(e)


@app.route('/evoting/deletevotermaster', methods=["POST"], strict_slashes=False)
def deletevotermaster():
    r = request.json
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "delete from votermaster where voteID={0}".format(r['id'])
    mycursor.execute(tx)
    mydb.commit()
    mydb.close()
    return 's'


@app.route('/evoting/generateotp', methods=["POST"], strict_slashes=False)
def generateotp():
    import random
    y = random.randint(1000, 9999)
#      output(y)
    return str(y)
# getelectionforresult


@app.route('/evoting/getelectionforresult', methods=["POST"], strict_slashes=False)
def getelectionforresult():
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "select *   from electiondetails where resultdate=CURRENT_DATE() and status!='ended'"
    mycursor.execute(tx)
    e = mycursor.fetchall()
    mydb.close()
    print(e)
    return json.dumps(e)


@app.route('/evoting/publishresult', methods=["POST"], strict_slashes=False)
def publishresult():
    r = request.json
    print(r)
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "update electiondetails set status='ended' where electionid='%s'" % (
        r["electionid"])
    mycursor.execute(tx)
    mydb.commit()
    mydb.close()

    return 's'


@app.route('/evoting/login', methods=["POST"], strict_slashes=False)
def login():
    r = request.json
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "select *   from votermaster where emailid='%s' and password='%s' and isapproved=1" % (
        r["emailid"], r["pass"])
    mycursor.execute(tx)
    try:
        e = mycursor.fetchall()[0]
    except:
        e = "no"
    mydb.close()
    return json.dumps(e)


@app.route('/evoting/AnalysisVoterGenderWiseReport', methods=["POST"], strict_slashes=False)
def AnalysisVoterGenderWiseReport():
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "select gender,count(gender) from votermaster group by gender"
    mycursor.execute(tx)
    e = mycursor.fetchall()
    print(e)
    mydb.close()
    return json.dumps(e)


@app.route('/evoting/Agewisereport', methods=["POST"], strict_slashes=False)
def Agewisereport():
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "SELECT DATE_FORMAT(FROM_DAYS(DATEDIFF(now(),dob)), '%Y')+0 as age , count(DATE_FORMAT(FROM_DAYS(DATEDIFF(now(),dob)), '%Y')+0) as counts FROM `votermaster` group by DATE_FORMAT(FROM_DAYS(DATEDIFF(now(),dob)), '%Y')+0;"
    mycursor.execute(tx)
    e = mycursor.fetchall()
    print(e)
    mydb.close()
    return json.dumps(e)


@app.route('/evoting/ElectionResultPoliticalPartyWise', methods=["POST"], strict_slashes=False)
def ElectionResultPoliticalPartyWise():
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "select electionid,nomitationID,count(nomitationID) as totalvote from castvote  where EXISTS(select * from electiondetails where status='ended')GROUP by nomitationID,electionid;"
    mycursor.execute(tx)
    e = mycursor.fetchall()
    print(e)
    val = []
    for x in e:
        x = list(x)
        mycursor1 = mydb.cursor()
        tx1 = "select * from electiondetails  where electionid='%s'" % (x[0])
        mycursor1.execute(tx1)
        v = mycursor1.fetchall()
        print(v)
        x.append(v[0][1])
        mycursor1 = mydb.cursor()
        tx1 = "select voterid,politicalPartyID from electionnomitation  where nomitationID='%s'" % (
            x[1])
        mycursor1.execute(tx1)
        v = mycursor1.fetchone()
        mycursor1 = mydb.cursor()
        tx1 = "select firstname,constituencyID from votermaster  where voteid='%s'" % (
            v[0])
        mycursor1.execute(tx1)
        n = mycursor1.fetchone()
        x.append(n[0])
        tx1 = "select politicalPartyName FROM `politicalpartymaster` where politicalPartyID='%s'" % (
            n[1])
        mycursor1.execute(tx1)
        nr = mycursor1.fetchone()
        x.append(nr[0])
        tx1 = "select constituencyName from constituencymaster  where constituencyID='%s'" % (
            n[1])
        mycursor1.execute(tx1)
        n = mycursor1.fetchone()[0]
        x.append(n)
        val.append(x)

    mydb.close()
    return json.dumps(val)


if __name__ == '__main__':
    app.run(debug=True)
