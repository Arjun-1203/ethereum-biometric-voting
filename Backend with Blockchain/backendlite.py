import smtplib
# import mysql.connector
from flask_cors import CORS
import os
from flask import *
from solcx import compile_standard, install_solc
from web3 import Web3
# from web3.middleware import geth_poa_middleware
from werkzeug.utils import secure_filename
import cv2
import numpy as np
from tensorflow.keras.applications import VGG16
from sklearn.neighbors import KNeighborsClassifier
import joblib
import sqlite3
import json
import secrets
import time
from datetime import timezone
import mysql.connector
import datetime

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
UPLOAD_FOLDER = 'static/'  # Directory to save uploaded images
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Global variables for blockchain connection
GANACHE_URL = "http://127.0.0.1:7545"  # Default Ganache URL
CHAIN_ID = 1337  # Default Ganache chain ID
CONTRACT_ADDRESS = None
CONTRACT_ABI = None

# Initialize Web3 connection
w3 = Web3(Web3.HTTPProvider(GANACHE_URL))
if not w3.is_connected():
    print("⚠️ Warning: Could not connect to Ganache. Make sure Ganache is running.")

# Load VGG16 for feature extraction
vgg_model = VGG16(weights='imagenet', include_top=False, input_shape=(224, 224, 3))

# Database setup
DB_PATH = "fingerprints.db"

# Add verification tokens storage
verification_tokens = {}

# Load shared config
CONFIG_PATH = r"C:/Users/ASUS/OneDrive/Desktop/New folder (3)/mobile/app/Evoting/config.json"
with open(CONFIG_PATH) as f:
    config = json.load(f)
BASE_URL = config["base_url"]

def preprocess_fingerprint(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if contours:
        x, y, w, h = cv2.boundingRect(max(contours, key=cv2.contourArea))
        fingerprint = image[y:y+h, x:x+w]
        return cv2.resize(fingerprint, (224, 224))
    
    return None

def extract_features(image):
    img_resized = cv2.resize(image, (224, 224))
    img_rgb = cv2.cvtColor(img_resized, cv2.COLOR_BGR2RGB)
    img_preprocessed = np.expand_dims(img_rgb, axis=0) / 255.0
    features = vgg_model.predict(img_preprocessed, verbose=0)
    return features.flatten()

# Train KNN Model
def train_knn():
    conn = sqlite3.connect("fingerprints.db")
    cursor = conn.cursor()
    cursor.execute("SELECT name, features FROM users")
    data = cursor.fetchall()
    conn.close()

    if len(data) < 2:
        return None  # Not enough data to train

    features, labels = zip(*[(np.frombuffer(row[1], dtype=np.float32), row[0]) for row in data])
    knn = KNeighborsClassifier(n_neighbors=min(3, len(features)))
    knn.fit(np.array(features), np.array(labels))

    joblib.dump(knn, 'knn_model.pkl')
    return knn

def compile_and_deploy_contract():
    global CONTRACT_ADDRESS, CONTRACT_ABI
    
    print("Compiling and deploying the Voting contract...")
    
    # Install solc compiler if not already installed
    install_solc("0.8.0")
    
    # Read the contract file
    with open("VotingContract.sol", "r") as file:
        contract_source = file.read()
    
    # Compile the contract
    compiled_sol = compile_standard(
        {
            "language": "Solidity",
            "sources": {"VotingContract.sol": {"content": contract_source}},
            "settings": {
                "outputSelection": {
                    "*": {
                        "*": ["abi", "metadata", "evm.bytecode", "evm.bytecode.sourceMap"]
                    }
                }
            },
        },
        solc_version="0.8.0",
    )
    
    # Save compiled code for reference
    with open("compiled_voting_contract.json", "w") as file:
        json.dump(compiled_sol, file)
    
    # Get bytecode and ABI
    bytecode = compiled_sol["contracts"]["VotingContract.sol"]["VotingSystem"]["evm"]["bytecode"]["object"]
    abi = json.loads(
        compiled_sol["contracts"]["VotingContract.sol"]["VotingSystem"]["metadata"]
    )["output"]["abi"]
    
    # Deploy the contract
    VotingContract = w3.eth.contract(abi=abi, bytecode=bytecode)
    
    # Get the first account from Ganache
    admin_account = w3.eth.accounts[0]
    
    try:
        # Use direct transact method for Ganache
        tx_hash = VotingContract.constructor().transact({
            'from': admin_account,
            'gas': 5000000,
            'gasPrice': w3.to_wei('50', 'gwei')
        })
        
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        # Save contract address and ABI
        CONTRACT_ADDRESS = tx_receipt.contractAddress
        CONTRACT_ABI = abi
        
        print(f"✅ Contract deployed at: {CONTRACT_ADDRESS}")
        
        # Save contract info to file for future reference
        with open("contract_info.json", "w") as file:
            json.dump({
                "address": CONTRACT_ADDRESS,
                "abi": CONTRACT_ABI
            }, file)
        
        return CONTRACT_ADDRESS
    
    except Exception as e:
        print(f"❌ Error deploying contract: {e}")
        return None

# Try to load existing contract info
try:
    with open("contract_info.json", "r") as file:
        contract_info = json.load(file)
        CONTRACT_ADDRESS = contract_info["address"]
        CONTRACT_ABI = contract_info["abi"]
        print(f"📝 Loaded existing contract at: {CONTRACT_ADDRESS}")
except FileNotFoundError:
    print("🔍 No existing contract found. Will deploy a new one when needed.")

# Function to get contract instance
def get_contract():
    global CONTRACT_ADDRESS, CONTRACT_ABI
    
    if CONTRACT_ADDRESS is None or CONTRACT_ABI is None:
        CONTRACT_ADDRESS = compile_and_deploy_contract()
        if CONTRACT_ADDRESS is None:
            return None
    
    return w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)

# Blockchain integration functions
def register_voter_on_chain(voter_address):
    """Register a voter on the blockchain"""
    contract = get_contract()
    if not contract:
        return {"success": False, "error": "Contract not available"}
    
    admin_account = w3.eth.accounts[0]
    
    try:
        # Use direct transact method for Ganache
        tx_hash = contract.functions.registerVoter(voter_address).transact({
            'from': admin_account,
            'gas': 200000,
            'gasPrice': w3.to_wei('50', 'gwei')
        })
        
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return {
            "success": True,
            "transaction_hash": w3.to_hex(receipt.transactionHash)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def parse_date(date_str, include_time=False, is_end_of_day=False):
    """Parse a date string and return Unix timestamp.
    
    Args:
        date_str: Date string in ISO format or date-only format
        include_time: Whether time should be included in parsing
        is_end_of_day: If True and no time provided, set time to 23:59:59
    """
    print(f"Parsing date: {date_str} (include_time={include_time}, is_end_of_day={is_end_of_day})")
    
    try:
        if 'T' in date_str:  # ISO format with time
            # Remove 'Z' and add timezone if needed
            if date_str.endswith('Z'):
                date_str = date_str[:-1] + '+00:00'
            dt = datetime.datetime.fromisoformat(date_str)
        else:  # Date only format
            # Parse as UTC date
            dt = datetime.datetime.strptime(date_str, '%Y-%m-%d')
            
            # Print debug info about the parsed date
            print(f"Parsed date from string: {dt.year}-{dt.month}-{dt.day}")
            
            if is_end_of_day:
                dt = dt.replace(hour=23, minute=59, second=59)
            elif include_time:
                dt = dt.replace(hour=0, minute=0, second=0)
            # Set timezone to UTC
            dt = dt.replace(tzinfo=datetime.timezone.utc)
    
        # Convert to UTC if not already
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.timezone.utc)
        else:
            dt = dt.astimezone(datetime.timezone.utc)
            
        timestamp = int(dt.timestamp())
        print(f"Parsed timestamp: {timestamp} ({dt} UTC)")
        
        return timestamp
    except Exception as e:
        print(f"Error parsing date {date_str}: {e}")
        
        # Special handling for dates in DD.MM.YY format (like 29.4.25)
        try:
            # Parse in the format DD.MM.YY
            if '.' in date_str:
                day, month, year = map(int, date_str.split('.'))
                # Adjust year to full format (e.g., 25 -> 2025)
                if year < 100:
                    year += 2000
                
                print(f"Parsing date in DD.MM.YY format: {day}.{month}.{year}")
                
                dt = datetime.datetime(year, month, day)
                
                if is_end_of_day:
                    dt = dt.replace(hour=23, minute=59, second=59)
                elif include_time:
                    dt = dt.replace(hour=0, minute=0, second=0)
                
                # Set timezone to UTC
                dt = dt.replace(tzinfo=datetime.timezone.utc)
                
                timestamp = int(dt.timestamp())
                print(f"Parsed timestamp from DD.MM.YY: {timestamp} ({dt} UTC)")
                
                return timestamp
        except Exception as inner_e:
            print(f"Error parsing date in DD.MM.YY format: {inner_e}")
        
        # If all parsing attempts fail, reraise the original exception
        raise

def create_election_on_blockchain(name, nomination_end, election_date, result_date):
    """Create a new election on the blockchain"""
    contract = get_contract()
    if not contract:
        return {"success": False, "error": "Contract not available"}
    
    admin_account = w3.eth.accounts[0]
    
    try:
        # Print original received timestamps for debugging
        print(f"Creating election with timestamps (UTC): nomination={nomination_end}, election={election_date}, result={result_date}")
        print(f"Nomination end as date: {datetime.datetime.fromtimestamp(nomination_end, tz=datetime.timezone.utc)}")
        
        # Use direct transact method for Ganache
        tx_hash = contract.functions.createElection(
            name, nomination_end, election_date, result_date
        ).transact({
            'from': admin_account,
            'gas': 300000,
            'gasPrice': w3.to_wei('50', 'gwei')
        })
        
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        # Get the election ID (it will be the current electionCount)
        election_id = contract.functions.electionCount().call()
        
        # Verify the election was created and is active
        election = contract.functions.getElection(election_id).call()
        if not election[5]:  # index 5 is isActive field
            return {"success": False, "error": "Election was created but is not active. Please check the dates."}
        
        return {
            "success": True,
            "transaction_hash": w3.to_hex(receipt.transactionHash),
            "election_id": election_id
        }
    except Exception as e:
        print(f"Error creating election on chain: {str(e)}")
        return {"success": False, "error": str(e)}

def register_candidate_on_chain(election_id, candidate_name, party_id, constituency_id):
    """Register a candidate for an election on the blockchain"""
    contract = get_contract()
    if not contract:
        return {"success": False, "error": "Contract not available"}
    
    admin_account = w3.eth.accounts[0]
    
    try:
        # First check if the election exists and nomination period is still open
        try:
            election = contract.functions.getElection(election_id).call()
            
            # Check if nomination period is still open
            import datetime
            from datetime import timezone
            current_ts = int(datetime.datetime.now(timezone.utc).timestamp())
            nomination_end_ts = election[2]  # index 2 is nominationEndDate
            
            print(f"Debug Timestamps:")
            print(f"Current time (UTC): {datetime.datetime.fromtimestamp(current_ts, timezone.utc)}")
            print(f"Nomination end (UTC): {datetime.datetime.fromtimestamp(nomination_end_ts, timezone.utc)}")
            
            if current_ts >= nomination_end_ts:  # index 2 is nominationEndDate
                return {"success": False, "error": f"Nomination period has ended for this election. Current time: {datetime.datetime.fromtimestamp(current_ts, timezone.utc)}, End time: {datetime.datetime.fromtimestamp(nomination_end_ts, timezone.utc)}"}
                
        except Exception as check_error:
            print(f"Error checking election status: {str(check_error)}")
            return {"success": False, "error": "Failed to verify election status. Please try again."}
        
        # Use direct transact method for Ganache
        tx_hash = contract.functions.registerCandidate(
            election_id, candidate_name, party_id, constituency_id
        ).transact({
            'from': admin_account,
            'gas': 300000,
            'gasPrice': w3.to_wei('50', 'gwei')
        })
        
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        # Get the candidate ID (it will be the current candidateCount for this election)
        candidate_id = contract.functions.getCandidateCount(election_id).call()
        
        return {
            "success": True,
            "transaction_hash": w3.to_hex(receipt.transactionHash),
            "candidate_id": candidate_id
        }
    except Exception as e:
        error_msg = str(e)
        if "Nomination period ended" in error_msg:
            return {"success": False, "error": "Nomination period has ended for this election."}
        return {"success": False, "error": f"Failed to register candidate: {error_msg}"}

def cast_vote_on_chain(voter_address, private_key, election_id, candidate_id):
    """Cast a vote on the blockchain"""
    contract = get_contract()
    if not contract:
        return {"success": False, "error": "Contract not available"}
    
    try:
        # For Ganache, we don't need to use the private key as all accounts are unlocked
        # Just check if the voter's address is in Ganache's accounts
        ganache_accounts = [addr.lower() for addr in w3.eth.accounts]
        if voter_address.lower() not in ganache_accounts:
            return {"success": False, "error": f"Voter address {voter_address} not found in Ganache accounts. Available accounts: {ganache_accounts[:3]}..."}
        
        # Use direct transact method for Ganache
        tx_hash = contract.functions.castVote(election_id, candidate_id).transact({
            'from': voter_address,
            'gas': 200000,
            'gasPrice': w3.to_wei('50', 'gwei')
        })
        
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return {
            "success": True,
            "transaction_hash": w3.to_hex(receipt.transactionHash)
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def end_election_on_chain(election_id):
    """End an election on the blockchain"""
    contract = get_contract()
    if not contract:
        return {"success": False, "error": "Contract not available"}
    
    admin_account = w3.eth.accounts[0]
    
    try:
        # First check if election exists and is already inactive on the blockchain
        try:
            election = contract.functions.getElection(election_id).call()
            # If election exists on blockchain but is inactive, return success
            if not election[5]:  # index 5 is isActive field
                print(f"⚠️ Election {election_id} is already inactive on blockchain. Skipping end operation.")
                return {
                    "success": True,
                    "already_inactive": True,
                    "transaction_hash": None
                }
        except Exception as check_error:
            print(f"Error checking election status: {str(check_error)}")
            # Continue to try ending the election if we couldn't check its status
        
        # Use direct transact method for Ganache
        tx_hash = contract.functions.endElection(election_id).transact({
            'from': admin_account,
            'gas': 200000,
            'gasPrice': w3.to_wei('50', 'gwei')
        })
        
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return {
            "success": True,
            "transaction_hash": w3.to_hex(receipt.transactionHash)
        }
    except Exception as e:
        error_str = str(e).lower()
        # Check if this is the "already inactive" error
        if "inactive" in error_str or "already ended" in error_str:
            print(f"⚠️ Election {election_id} is already inactive. Continuing with result declaration.")
            return {
                "success": True,
                "already_inactive": True,
                "transaction_hash": None,
                "original_error": str(e)
            }
        return {"success": False, "error": str(e)}

def declare_result_on_chain(election_id):
    """Declare results for an election on the blockchain"""
    contract = get_contract()
    if not contract:
        return {"success": False, "error": "Contract not available"}
    
    admin_account = w3.eth.accounts[0]
    
    try:
        # First check if results are already declared
        try:
            election = contract.functions.getElection(election_id).call()
            # If results are already declared, return success
            if election[6]:  # index 6 is resultDeclared field
                print(f"⚠️ Results for election {election_id} are already declared on blockchain. Skipping declaration.")
                return {
                    "success": True,
                    "already_declared": True,
                    "transaction_hash": None
                }
        except Exception as check_error:
            print(f"Error checking election result status: {str(check_error)}")
            # Continue to try declaring results if we couldn't check
        
        # Use direct transact method for Ganache
        tx_hash = contract.functions.declareResult(election_id).transact({
            'from': admin_account,
            'gas': 200000,
            'gasPrice': w3.to_wei('50', 'gwei')
        })
        
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return {
            "success": True,
            "transaction_hash": w3.to_hex(receipt.transactionHash)
        }
    except Exception as e:
        error_str = str(e).lower()
        # Check if this is an error about results already being declared
        if "already declared" in error_str or "already inactive" in error_str:
            print(f"⚠️ Results for election {election_id} might already be declared. Error: {str(e)}")
            return {
                "success": True,
                "already_declared": True,
                "transaction_hash": None,
                "original_error": str(e)
            }
        return {"success": False, "error": str(e)}

def get_election_results_from_chain(election_id):
    """Get election results from the blockchain"""
    contract = get_contract()
    if not contract:
        return {"success": False, "error": "Contract not available"}
    
    try:
        # Get election details
        election = contract.functions.getElection(election_id).call()
        
        if not election[6]:  # resultDeclared field is at index 6
            return {"success": False, "error": "Results not yet declared"}
        
        # Get candidate count
        candidate_count = contract.functions.getCandidateCount(election_id).call()
        
        # Get all candidates and their vote counts
        candidates = []
        for i in range(1, candidate_count + 1):
            candidate = contract.functions.getCandidate(election_id, i).call()
            candidates.append({
                "id": candidate[0],
                "name": candidate[1],
                "party_id": candidate[2],
                "constituency_id": candidate[3],
                "vote_count": candidate[4]
            })
        
        return {
            "success": True,
            "election": {
                "id": election[0],
                "name": election[1],
                "nomination_end_date": election[2],
                "election_date": election[3],
                "result_date": election[4],
                "is_active": election[5],
                "result_declared": election[6]
            },
            "candidates": candidates
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def train(v,name):
    cap = cv2.VideoCapture(v)
    fingerprints = []
    
    for _ in range(20):
        ret, frame = cap.read()
        if not ret:
            break
        fingerprint = preprocess_fingerprint(frame)
        if fingerprint is not None:
            fingerprints.append(fingerprint)
    
    cap.release()

    if not fingerprints:
        return jsonify({"error": "No fingerprint detected"}), 400

    conn = sqlite3.connect("fingerprints.db")
    cursor = conn.cursor()
    
    for fingerprint in fingerprints:
        features = extract_features(fingerprint)
        cursor.execute("INSERT INTO users (name, features) VALUES (?, ?)", 
                       (name, features.tobytes()))
    
    conn.commit()
    conn.close()

    train_knn()  # Retrain KNN after adding new user
    return jsonify({"status": "success", "message": "Face recording completed successfully"})

def test(video_path, name):
    print(f"Testing started for {video_path}")
    
    frame_skip = 5 
    early_exit_threshold = 10
    
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print("Error: Unable to open video file.")
        return jsonify({"error": "Invalid video file"}), 400
    
    try:
        knn = joblib.load('knn_model.pkl')
    except Exception as e:
        print("Error loading KNN model:", e)
        return jsonify({"error": "KNN model not found"}), 500

    user_counts = {}
    frame_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            print("No more frames to read or video ended.")
            break

        if frame_count % frame_skip == 0:
            fingerprint = preprocess_fingerprint(frame)
            if fingerprint is not None:
                features = extract_features(fingerprint)
                
                try:
                    prediction = knn.predict([features])[0]
                    user_counts[prediction] = user_counts.get(prediction, 0) + 1

                    # Stop early if a user reaches the threshold
                    if user_counts[prediction] >= early_exit_threshold:
                        cap.release()
                        print(prediction,name)
                        # if(prediction==name):
                        #     return "User login success"
                        # else:
                        #     return "User Failed"
                        print(f"User {prediction} identified early with {user_counts[prediction]} matches.")
                        # return jsonify({"user": prediction}), 200
                except Exception as e:
                    print("Prediction error:", e)
                    return jsonify({"error": "Prediction failed"}), 500

        frame_count += 1

    cap.release()
    
    if not user_counts:
        print("No fingerprint detected in the video.")
        return jsonify({"error": "No fingerprint detected"}), 400

    identified_user = max(user_counts, key=user_counts.get)
    print(identified_user)
    if(identified_user==name):
        return "User login success"
    else:
        return "User login Failed"
    

def verify_image(image_path, name):
    print(f"Verifying image for {name}")
    
    try:
        # Load the image
        image = cv2.imread(image_path)
        if image is None:
            print("Error: Unable to read image file.")
            return "User login Failed"
        
        # Preprocess the image
        fingerprint = preprocess_fingerprint(image)
        if fingerprint is None:
            print("No face detected in image")
            return "User login Failed"
        
        # Extract features
        features = extract_features(fingerprint)
        
        # Load KNN model
        try:
            knn = joblib.load('knn_model.pkl')
        except Exception as e:
            print("Error loading KNN model:", e)
            return "User login Failed"
        
        # Make prediction
        try:
            prediction = knn.predict([features])[0]
            print(f"Predicted user: {prediction}, Expected user: {name}")
            
            if prediction == name:
                return "User login success"
            else:
                return "User login Failed"
        except Exception as e:
            print("Prediction error:", e)
            return "User login Failed"
            
    except Exception as e:
        print("Verification error:", e)
        return "User login Failed"

@app.route('/upload', methods=['POST'])
def dymentriyaupload():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
            
        name = request.form.get("u")
        data = request.form.get("data")
        
        if not name or not data:
            return jsonify({"error": "Missing required parameters"}), 400
            
        print(f"🔥 Received request for user: {name}, operation: {data}")

        # Generate unique filename
        import random
        file.filename = name + str(random.randint(0, 9999)) + file.filename
        file_path = os.path.join("static", file.filename)
        
        # Save the file
        file.save(file_path)
        print(f"✅ File saved to: {file_path}")

        if data == "register":
            return train(file_path, name)
        elif data == "verify":
            # Convert voteID to emailID if needed
            if name.isdigit():
                print(f"🔄 Detected voteID: {name}, fetching corresponding email...")
                mydb = connect()
                mycursor = mydb.cursor()
                mycursor.execute("SELECT emailID FROM votermaster WHERE voteId=?", (name,))
                result = mycursor.fetchone()
                mydb.close()

                if result:
                    print(f"✅ Found email: {result[0]}")
                    name = result[0]
                else:
                    print("❌ No user found for voteID.")
                    return jsonify({"error": "User not found"}), 404

            return verify_image(file_path, name)
        else:
            mydb = connect()
            mycursor = mydb.cursor()
            mycursor.execute("SELECT emailID FROM votermaster WHERE voteId=?", (name,))
            result = mycursor.fetchone()
            mydb.close()

            if result:
                name = result[0]
            else:
                return jsonify({"error": "User not found"}), 404

            x = test(file_path, name)
            print("🔍 Test result:", x)
            return x
            
    except Exception as e:
        print(f"❌ Error processing upload: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

    

# Ensure upload folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def output(y):

    pass


def sendmail(e, msg):
    # Skip sending if email is None or empty
    if not e:
        print("Warning: No email address provided, skipping email notification")
        return
        
    try:
        mail = smtplib.SMTP('smtp.gmail.com', 587)  # host and port area
        # Hostname to send for this command defaults to the FQDN of the local host.
        mail.ehlo()
        mail.starttls()  # security connection
        mail.login('arjun12122003@gmail.com', 'xoquxejecfkwnsnw')  # login part
        mail.sendmail('arjun12122003@gmail.com',
                  e, msg)  # send part
        print("Congrats! Your mail has been sent.")
    except Exception as e:
        print(f"Failed to send email: {str(e)}")


def connect():
    return sqlite3.connect("evoting.db")
    # return mysql.connector.connect(host="localhost", user="root",  password="",  database="evoting", auth_plugin='mysql_native_password', port="3307")

@app.route('/evoting/genertotp', methods=["POST"], strict_slashes=False)
def genertotp():
    r = request.json
    print(r)
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "select emailID from votermaster where voteId='%s'"%(r["id"])
    mycursor.execute(tx)
    name = mycursor.fetchone()[0]
    mydb.close()
    print(name,r["otp"])
    sendmail(name,r["otp"])
    return "success"

@app.route('/evoting/insertcastvote', methods=["POST"], strict_slashes=False)
def insertcastvote():
    r = request.json
    print(r)
    mydb = connect()
    mycursor = mydb.cursor()
    
    # Get nomination ID
    tx = "select nomitationID from electionnomitation where voterid='%s' and electionid='%s';" % (
        r["contestantid"], r["electionid"])
    mycursor.execute(tx)
    nominateid = mycursor.fetchone()[0]
    
    # Get next cast ID
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
    
    # Get voter's blockchain address
    tx = "select Account from votermaster where voteid='%s'" % (r["voterid"])
    mycursor.execute(tx)
    voter_data = mycursor.fetchone()
    voter_address = voter_data[0]
    
    # Cast vote on blockchain - with Ganache we don't need the private key
    # since all accounts are unlocked by default
    result = cast_vote_on_chain(voter_address, None, int(r["electionid"]), int(r["contestantid"]))
    
    if result["success"]:
        # Record vote in database
        tx_receipt = result["transaction_hash"]
        d = "insert into castvote(castid,nomitationID,voterid,blockchaingenerated,electionid)values ('%s','%s','%s','%s','%s')" % (
            eid, nominateid, r['voterid'], tx_receipt, r["electionid"])
        mycursor = mydb.cursor()
        mycursor.execute(d)
        mydb.commit()
        mydb.close()
        return jsonify({"status": "success", "message": "Vote cast successfully", "tx_hash": tx_receipt})
    else:
        mydb.close()
        return jsonify({"status": "error", "message": f"Failed to cast vote: {result['error']}"})


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
    print(d)
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


@app.route('/evoting/insertelectiondetails', methods=['POST'])
def create_election_on_chain():
    try:
        data = request.get_json()
        election_name = data['electionName']
        nomination_end = data['nominationLastDate']
        election_date = data['effDate']
        result_date = data['resultdate']
        include_time = data.get('includeTime', False)  # Get includeTime flag
        
        print(f"\nCreating election with includeTime={include_time}")
        print(f"Raw dates received:")
        print(f"- Nomination end: {nomination_end}")
        print(f"- Election date: {election_date}")
        print(f"- Result date: {result_date}")
        
        # Parse dates to Unix timestamps
        nomination_end_ts = parse_date(nomination_end, include_time, is_end_of_day=True)
        election_date_ts = parse_date(election_date, include_time)
        result_date_ts = parse_date(result_date, include_time)
        
        # Get current time for comparison
        current_time = int(datetime.datetime.now(datetime.timezone.utc).timestamp())
        print(f"\nTimestamp comparisons:")
        print(f"Current time: {current_time}")
        print(f"Nomination end: {nomination_end_ts} (in {nomination_end_ts - current_time} seconds)")
        print(f"Election date: {election_date_ts} (in {election_date_ts - current_time} seconds)")
        print(f"Result date: {result_date_ts} (in {result_date_ts - current_time} seconds)")
        
        # Convert timestamp back to date for debugging
        nomination_end_dt = datetime.datetime.fromtimestamp(nomination_end_ts, tz=datetime.timezone.utc)
        print(f"Nomination end as date: {nomination_end_dt.strftime('%Y-%m-%d %H:%M:%S')} UTC")
        
        # Validate timestamps
        if nomination_end_ts <= current_time:
            return jsonify({'error': 'Nomination end date must be in the future'}), 400
        if election_date_ts <= nomination_end_ts:
            return jsonify({'error': 'Election date must be after nomination end date'}), 400
        if result_date_ts <= election_date_ts:
            return jsonify({'error': 'Result date must be after election date'}), 400
        
        # Create election on blockchain first
        result = create_election_on_blockchain(
            election_name,
            nomination_end_ts,
            election_date_ts,
            result_date_ts
        )
        
        if result["success"]:
            # Get the election ID from the blockchain
            contract = get_contract()
            if not contract:
                return jsonify({"status": "error", "message": "Failed to get contract reference"})
            
            blockchain_election_id = contract.functions.electionCount().call()
            print(f"Retrieved election ID from blockchain: {blockchain_election_id}")
            
            # Record election in database using the blockchain ID
            mydb = connect()
            mycursor = mydb.cursor()
            sql = """
                INSERT INTO electiondetails 
                (electionID, electionName, nominationLastDate, effDate, resultdate, status)
                VALUES (?, ?, ?, ?, ?, ?)
            """
            values = (blockchain_election_id, election_name, nomination_end, election_date, result_date, 'started')
            mycursor.execute(sql, values)
            mydb.commit()
            mydb.close()
            
            return jsonify({
                "status": "success",
                "message": "Election created successfully",
                "tx_hash": result["transaction_hash"],
                "election_id": blockchain_election_id
            })
        else:
            return jsonify({"status": "error", "message": f"Failed to create election: {result['error']}"})
            
    except Exception as e:
        print(f"Error creating election: {str(e)}")
        if 'mydb' in locals():
            mydb.close()
        return jsonify({"status": "error", "message": f"Failed to create election: {str(e)}"}), 500

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
    
    # Get all elections from the database
    tx = "select * from electiondetails"
    mycursor.execute(tx)
    elections = mycursor.fetchall()
    
    # Process elections to update status based on dates
    updated_elections = []
    for election in elections:
        election = list(election)
        
        # Check if election date has passed but status is still 'started'
        if election[5] == 'started':
            # Get election date from index 3
            election_date_str = election[3]
            
            # Compare with today's date
            try:
                # Parse using SQLite date format (YYYY-MM-DD)
                import datetime
                election_date = datetime.datetime.strptime(election_date_str, '%Y-%m-%d').date()
                today = datetime.date.today()
                
                # If election date has passed, mark as completed in the response
                if election_date < today:
                    election[5] = 'completed'
            except Exception as e:
                print(f"Error processing date: {str(e)}")
        
        updated_elections.append(election)
        
    mydb.close()
    return json.dumps(updated_elections)


@app.route('/evoting/viewelectiondavaiable', methods=["POST"], strict_slashes=False)
def viewelectiondavaiable():
    r = request.json

    mydb = connect()
    mycursor = mydb.cursor()
    tx = "select * from electiondetails where  nominationLastDate>= DATE('now') and status!='ended'"
    mycursor.execute(tx)
    e = mycursor.fetchall()
    print(e)
    l = []
    for k in e:
        print(k)
        try:
            k = list(k)
            mycursor = mydb.cursor()
            print(k)
            tx = "select count(*) from electionnomitation where voterID='%s' and electionID='%s'" % (
                r["voterid"], k[0])
            print(tx)
            mycursor.execute(tx)
            rx = mycursor.fetchone()
            print(rx)
            if (rx[0] == 1):
                k[-1] = "nominated"
            else:
                k[-1] = "no nominated"
            print(k)
        except Exception as e:
            print(e)
            pass
        l.append(k)
    mydb.close()
    return json.dumps(l)


@app.route('/evoting/viewvoteavaiable', methods=["POST"], strict_slashes=False)
def viewvoteavaiable():
    r = request.json
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "SELECT * from electiondetails WHERE effDate= DATE('now') and status!='ended';"
    mycursor.execute(tx)
    e = mycursor.fetchall()
    l = []
    for k in e:
        k = list(k)
        mycursor = mydb.cursor()
        tx = "select count(*) from castvote where voterID='%s' and electionID='%s'" % (
            r["voterid"], k[0])
        mycursor.execute(tx)
        rx = mycursor.fetchone()
        if (rx[0] == 1):
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
    out = {}
    tx = "select * from constituencymaster where constituencyID=(select constituencyID from votermaster where voteid='%s');" % (
        r["voterid"])
    mycursor.execute(tx)
    e = mycursor.fetchone()
    out["constituency"] = e
    tx = "select p.politicalPartyName,v.firstName,v.voteID,p.image from politicalpartymaster p join electionnomitation e on e.politicalpartyid=p.politicalpartyid join votermaster v on v.voteid=e.voterid join electiondetails ex where e.electionid='%s'and ex.status!='ended';" % (
        r["electionid"])
    mycursor.execute(tx)
    e = mycursor.fetchall()
    out["political"] = e
    tx = "select count(*) from castvote where voterid='%s' and electionid=%s" % (
        r["voterid"],r["electionid"])
    print(tx)
    mycursor.execute(tx)
    e = mycursor.fetchone()[0]
    out["completed"] = e
    mydb.close()
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


@app.route('/evoting/insertelectionnomitation', methods=["POST"])
def insertelectionnomitation():
    r = request.json
    mydb = connect()
    mycursor = mydb.cursor()
    
    try:
        # First check if this voter has already nominated for this election
        check_query = """
            SELECT COUNT(*) 
            FROM electionnomitation 
            WHERE voterID = ? AND electionID = ?
        """
        mycursor.execute(check_query, (r['voterID'], r['electionID']))
        existing_count = mycursor.fetchone()[0]
        
        if existing_count > 0:
            mydb.close()
            return jsonify({
                "status": "error",
                "message": "You have already submitted a nomination for this election"
            }), 400
            
        # Check if the election is still open for nominations
        election_query = """
            SELECT nominationLastDate, status 
            FROM electiondetails 
            WHERE electionID = ? AND status != 'ended'
            AND DATE('now') <= DATE(nominationLastDate)
        """
        mycursor.execute(election_query, (r['electionID'],))
        election_data = mycursor.fetchone()
        
        if not election_data:
            mydb.close()
            return jsonify({
                "status": "error",
                "message": "The nomination period for this election has ended or the election is not active"
            }), 400
        
        # Get next nomination ID
        tx = 'select nomitationID from electionnomitation order by nomitationID desc limit 1'
        mycursor.execute(tx)
        e = mycursor.fetchall()
        if len(e) == 0:
            eid = 1
        else:
            eid = e[0][0]+1
        
        # Get candidate name from voter ID
        tx = "select firstName, lastName from votermaster where voteID=?"
        mycursor.execute(tx, (r['voterID'],))
        voter_data = mycursor.fetchone()
        if not voter_data:
            mydb.close()
            return jsonify({
                "status": "error",
                "message": "Voter not found"
            }), 404
            
        candidate_name = f"{voter_data[0]} {voter_data[1]}"
        
        # Register candidate on blockchain
        result = register_candidate_on_chain(
            int(r['electionID']),
            candidate_name,
            int(r['politicalPartyID']),
            int(r['constituencyID'])
        )
        
        if result["success"]:
            # Record nomination in database
            insert_query = """
                INSERT INTO electionnomitation
                (nomitationID, voterID, politicalPartyID, electionID, constituencyID)
                VALUES (?, ?, ?, ?, ?)
            """
            values = (eid, r['voterID'], r['politicalPartyID'], r['electionID'], r['constituencyID'])
            mycursor.execute(insert_query, values)
            mydb.commit()
            mydb.close()
            
            return jsonify({
                "status": "success",
                "message": "Nomination submitted successfully",
                "tx_hash": result["transaction_hash"]
            })
        else:
            mydb.close()
            return jsonify({
                "status": "error",
                "message": f"Failed to submit nomination: {result['error']}"
            })
            
    except Exception as e:
        print(f"Error in nomination submission: {str(e)}")
        if 'mydb' in locals():
            mydb.close()
        return jsonify({
            "status": "error",
            "message": f"Server error: {str(e)}"
        }), 500


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


@app.route('/evoting/viewelectionnomitation', methods=["POST", "GET"], strict_slashes=False)
def viewelectionnomitation():
    mydb = connect()
    mycursor = mydb.cursor()
    try:
        # Join with other tables to get complete information
        tx = """
            SELECT 
                en.nomitationID,
                en.voterID,
                en.politicalPartyID,
                en.electionID,
                en.constituencyID,
                vm.firstName || ' ' || vm.lastName as candidate_name,
                pp.politicalPartyName as party_name,
                cm.constituencyName as constituency_name,
                ed.electionName as election_name,
                ed.nominationLastDate as nomination_date,
                CASE 
                    WHEN DATE('now') > ed.nominationLastDate THEN 'Closed'
                    ELSE 'Open'
                END as status
            FROM electionnomitation en
            JOIN votermaster vm ON en.voterID = vm.voteID
            JOIN politicalpartymaster pp ON en.politicalPartyID = pp.politicalPartyID
            JOIN constituencymaster cm ON en.constituencyID = cm.constituencyID
            JOIN electiondetails ed ON en.electionID = ed.electionID
            ORDER BY en.nomitationID DESC
        """
        mycursor.execute(tx)
        nominations = mycursor.fetchall()
        
        # Convert to list of dictionaries for better JSON serialization
        formatted_nominations = []
        for nom in nominations:
            formatted_nominations.append({
                "id": nom[0],
                "voter_id": nom[1],
                "party_id": nom[2],
                "election_id": nom[3],
                "constituency_id": nom[4],
                "candidate_name": nom[5],
                "party_name": nom[6],
                "constituency": nom[7],
                "election_name": nom[8],
                "nomination_date": nom[9],
                "status": nom[10]
            })
        
        return json.dumps(formatted_nominations)
    except Exception as e:
        print(f"Error fetching nominations: {str(e)}")
        return json.dumps({"error": str(e)}), 500
    finally:
        mydb.close()


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


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/evoting/insertvotermaster', methods=['POST'])
def insertvotermaster():
    try:
        # Get form data
        title = request.form.get('title')
        firstName = request.form.get('firstName')
        lastName = request.form.get('lastName')
        address = request.form.get('address')
        city = request.form.get('city')
        state = request.form.get('state')
        dob = request.form.get('dob')
        constituencyID = request.form.get('constituencyID')
        isApproved = request.form.get('isApproved', '0')
        mobileNbr = request.form.get('mobileNbr')
        emailID = request.form.get('emailID')
        password = request.form.get('password')
        gender = request.form.get('gender')
        Account = request.form.get('Account')
        privatekey = request.form.get('privatekey')
        longitude = request.form.get('longitude')
        latitude = request.form.get('latitude')
        image = request.files.get('image')
        faceRecord = request.files.get('faceRecord')
        addressProof = request.files.get('addressProof')
        ageProof = request.files.get('ageProof')

        # Use the connect() function to get database connection
        mydb = connect()
        mycursor = mydb.cursor()

        # Check for existing mobile number
        mycursor.execute("SELECT COUNT(*) FROM votermaster WHERE mobileNbr = ?", (mobileNbr,))
        mobile_count = mycursor.fetchone()[0]
        
        # Check for existing email
        mycursor.execute("SELECT COUNT(*) FROM votermaster WHERE emailID = ?", (emailID,))
        email_count = mycursor.fetchone()[0]
        
        if mobile_count > 0:
            mydb.close()
            return jsonify({'status': 'error', 'message': 'Mobile number already registered'})
        
        if email_count > 0:
            mydb.close()
            return jsonify({'status': 'error', 'message': 'Email already registered'})
            
        # Get next voter ID
        tx = "select voteID from votermaster order by voteID desc limit 1"
        mycursor.execute(tx)
        e = mycursor.fetchall()
        if len(e) == 0:
            eid = 1
        else:
            eid = e[0][0]+1
        
        # Generate verification token
        token = generate_verification_token()
        
        # Save to database
        d = """INSERT INTO votermaster(
               voteID, title, firstName, lastName, address, city, state, dob, constituencyID, 
               isApproved, mobileNbr, emailID, password, gender, Account, privatekey, 
               longitude, latitude, email_verified)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"""
        
        values = (
            eid, title, firstName, lastName, address, city, state, dob, constituencyID,
            isApproved, mobileNbr, emailID, password, gender, Account, privatekey,
            longitude, latitude, 0  # email_verified = 0 (False)
        )
        
        mycursor.execute(d, values)
        mydb.commit()
        mydb.close()

        # Send verification email
        send_verification_email(emailID, token)

    except Exception as e:
        print(f"❌ Error processing voter registration: {str(e)}")
        if 'mydb' in locals():
            mydb.close()
        return jsonify({"status": "error", "message": "Internal server error"}), 500

    return jsonify({
            'status': 'success',
            'message': 'Registration successful. Please check your email to verify your account.',
            'voteID': eid
        })


@app.route('/evoting/updatevotermaster', methods=["POST"], strict_slashes=False)
def updatevotermaster():
    r = request.json
    mydb = connect()
    d = "update votermaster set title ='%s',firstName ='%s',lastName ='%s',address ='%s',city ='%s',state ='%s',dob ='%s',addressProof ='%s',ageProof ='%s',constituencyID ='%s',isApproved ='%s',mobileNbr ='%s',emailID ='%s',password ='%s',gender ='%s',Account ='%s',privatekey ='%s' where voteID='%s'" % (
        r['title'], r['firstName'], r['lastName'], r['address'], r['city'], r['state'], r['dob'], r['addressProof'], r['ageProof'], r['constituencyID'], r['isApproved'], r['mobileNbr'], r['emailID'], r['password'], r['gender'], r['Account'], r['privatekey'], r['voteID'])
    mycursor = mydb.cursor()
    mycursor.execute(d)
    mydb.commit()
    mydb.close()
    return 's'


@app.route('/evoting/approvevotermaster', methods=["POST"], strict_slashes=False)
def approvevotermaster():
    r = request.json
    
    try:
        # Check if email ID exists in request
        email_id = r.get("emailID")
        if not email_id:
            # If not in request, try to get it from the database
            mydb = connect()
            mycursor = mydb.cursor()
            try:
                mycursor.execute("SELECT emailID, email_verified FROM votermaster WHERE voteID=?", (r["voteID"],))
                result = mycursor.fetchone()
                if result:
                    email_id = result[0]
                    email_verified = result[1]
                    if not email_verified:
                        return jsonify({
                            "status": "error",
                            "message": "Cannot approve voter: Email not verified"
                        })
            except Exception as db_err:
                print(f"Error fetching email from database: {str(db_err)}")
                return jsonify({
                    "status": "error",
                    "message": f"Database error: {str(db_err)}"
                })
            finally:
                mydb.close()
                
        # Check if Web3 is connected
        if not w3.is_connected():
            return jsonify({
                "status": "error", 
                "message": "Cannot connect to Ethereum network. Make sure Ganache is running."
            })
            
        # Get the list of available Ganache accounts, starting from index 1
        # (since account 0 is used as admin)
        try:
            ganache_accounts = w3.eth.accounts[1:]
            if not ganache_accounts:
                return jsonify({
                    "status": "error", 
                    "message": "No Ganache accounts available. Please check your Ganache instance."
                })
        except Exception as e:
            return jsonify({
                "status": "error", 
                "message": f"Failed to get Ganache accounts: {str(e)}"
            })
        
        # Get the contract
        contract = get_contract()
        if not contract:
            return jsonify({
                "status": "error", 
                "message": "Failed to get contract instance. Make sure the contract is deployed."
            })
        
        # Find an address that is not already registered on the blockchain
        voter_address = None
        for address in ganache_accounts:
            # Check if this address is already registered on the blockchain
            try:
                # Get the voter struct from the smart contract
                voter_data = contract.functions.voters(address).call()
                # First element (index 0) is isRegistered
                is_registered = voter_data[0]
                
                if not is_registered:
                    # Found an unregistered address, use it
                    voter_address = address
                    break
            except Exception as e:
                print(f"Error checking address {address}: {str(e)}")
                continue
        
        if voter_address is None:
            return jsonify({
                "status": "error", 
                "message": "No available unregistered Ethereum addresses found. Please restart Ganache or add more accounts."
            })
        
        # For Ganache, we'll use a fixed private key for demo purposes
        # In production, you'd use secure key management
        # Note: This is for demo only, in real applications NEVER hardcode private keys
        voter_private_key = "0x" + "0" * 63 + str(ganache_accounts.index(voter_address) + 1)
        
        # Register voter on blockchain
        result = register_voter_on_chain(voter_address)
        
        if result["success"]:
            mydb = connect()
            d = "update votermaster set isApproved='%s',account='%s',privatekey='%s' where voteid='%s'" % (
                r["isApproved"], voter_address, voter_private_key, r["voteID"])
            mycursor = mydb.cursor()
            mycursor.execute(d)
            
            # Send email with blockchain address if email is available
            if email_id:
                sendmail(email_id, "Your voter registration has been approved. You can now login to cast your vote in upcoming elections.")
            
            mydb.commit()
            mydb.close()
            return jsonify({
                "status": "success", 
                "message": "Voter approved successfully", 
                "tx_hash": result["transaction_hash"],
                "account": voter_address
            })
        else:
            return jsonify({"status": "error", "message": f"Failed to register voter on blockchain: {result['error']}"})
    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        print("Approval Error:", traceback_str)
        return jsonify({"status": "error", "message": f"Error approving voter: {str(e)}"})


@app.route('/evoting/viewvotermaster', methods=["POST"], strict_slashes=False)
def viewvotermaster():
    mydb = connect()
    mycursor = mydb.cursor()
    tx = "select * from votermaster where isApproved=1"
    mycursor.execute(tx)
    e = mycursor.fetchall()
    mydb.close()
    return json.dumps(e)


@app.route('/evoting/viewpendingvoters', methods=["POST"], strict_slashes=False)
def viewpendingvoters():
    mydb = connect()
    mycursor = mydb.cursor()
    # Explicitly select all fields including email_verified
    tx = "select voteID, title, firstName, lastName, address, city, state, dob, addressProof, ageProof, constituencyID, isApproved, mobileNbr, emailID, password, gender, longitude, latitude, image, email_verified from votermaster where isApproved=0"
    mycursor.execute(tx)
    e = mycursor.fetchall()
    mydb.close()
    return json.dumps(e)


@app.route('/evoting/deletevotermaster', methods=["POST"], strict_slashes=False)
def deletevotermaster():
    r = request.json
    mydb = connect()
    mycursor = mydb.cursor()
    
    try:
        # First get the emailID of the voter to be deleted
        tx = "SELECT emailID FROM votermaster WHERE voteID=?"
        mycursor.execute(tx, (r['id'],))
        result = mycursor.fetchone()
        
        if result:
            emailID = result[0]
            
            # Delete from votermaster
            tx = "DELETE FROM votermaster WHERE voteID=?"
            mycursor.execute(tx, (r['id'],))
            mydb.commit()
            
            # Delete face data from fingerprints.db
            try:
                face_db = sqlite3.connect("fingerprints.db")
                face_cursor = face_db.cursor()
                
                # Delete all entries for this user
                face_cursor.execute("DELETE FROM users WHERE name=?", (emailID,))
                face_db.commit()
                
                # Retrain the KNN model after deletion
                train_knn()
                
                face_db.close()
            except Exception as e:
                print(f"Error deleting face data: {str(e)}")
                # Continue even if face deletion fails
        
        mydb.close()
        return 's'
    except Exception as e:
        print(f"Error in deletevotermaster: {str(e)}")
        if 'mydb' in locals():
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
    
    try:
        # Check if Web3 is connected
        if not w3.is_connected():
            print("⚠️ Warning: Could not connect to blockchain. Check your Ganache connection.")
        
        # Get the contract
        contract = get_contract()
        if not contract:
            print("⚠️ Warning: Could not load contract. Check your Ganache connection.")
        
        # First, update election statuses based on blockchain state
        if contract:
            try:
                # Get all elections that might need status updates
                update_check_tx = """
                    SELECT electionid FROM electiondetails 
                    WHERE status = 'started' AND (resultdate <= DATE('now') OR resultdate = DATE('now'))
                """
                mycursor.execute(update_check_tx)
                elections_to_check = mycursor.fetchall()
                
                for election_row in elections_to_check:
                    election_id = election_row[0]
                    try:
                        # Check blockchain status
                        election_on_chain = contract.functions.getElection(int(election_id)).call()
                        
                        # If inactive on blockchain but active in DB, update DB
                        if not election_on_chain[5] or election_on_chain[6]:  # inactive or results declared
                            update_tx = "UPDATE electiondetails SET status='ended' WHERE electionid=?"
                            mycursor.execute(update_tx, (election_id,))
                            mydb.commit()
                            print(f"✅ Synchronized DB: Election {election_id} marked as ended based on blockchain state")
                    except Exception as e:
                        print(f"⚠️ Error checking blockchain for election {election_id}: {str(e)}")
            except Exception as e:
                print(f"⚠️ Error during blockchain synchronization: {str(e)}")
        
        # Now get elections that are eligible for publishing (result date passed, not ended)
        tx = "SELECT * FROM electiondetails WHERE (resultdate <= DATE('now') OR resultdate = DATE('now')) AND status != 'ended'"
        
        mycursor.execute(tx)
        elections = mycursor.fetchall()
        
        print(f"Found {len(elections)} elections eligible for publishing")
        mydb.close()
        return json.dumps(elections)
    except Exception as e:
        print(f"❌ Error in getelectionforresult: {str(e)}")
        if 'mydb' in locals():
            mydb.close()
        return json.dumps([])  # Return empty list on error


@app.route('/evoting/publishresult', methods=["POST"], strict_slashes=False)
def publishresult():
    r = request.json
    print(f"📊 Publishing results for election ID: {r.get('electionid')}")
    
    if not r.get("electionid"):
        return jsonify({"status": "error", "message": "Missing election ID"})
    
    try:
        election_id = int(r["electionid"])
        
        # Check if Web3 is connected
        if not w3.is_connected():
            return jsonify({"status": "error", "message": "Could not connect to blockchain. Please check your Ganache connection."})
        
        # Get contract reference
        contract = get_contract()
        if not contract:
            return jsonify({"status": "error", "message": "Failed to get contract reference"})
            
        # First check if election exists and isn't already ended in the database
        mydb = connect()
        mycursor = mydb.cursor()
        check_tx = "SELECT status FROM electiondetails WHERE electionid = ?"
        mycursor.execute(check_tx, (election_id,))
        result = mycursor.fetchone()
        
        if not result:
            mydb.close()
            return jsonify({"status": "error", "message": "Election not found"})
        
        if result[0] == 'ended':
            mydb.close()
            return jsonify({"status": "success", "message": "Election is already ended in database"})
        
        # Check blockchain state directly first to handle different scenarios
        try:
            election_on_chain = contract.functions.getElection(election_id).call()
            is_active = election_on_chain[5]  # isActive field 
            results_declared = election_on_chain[6]  # resultDeclared field
            
            # Case 1: Already inactive AND results already declared
            if not is_active and results_declared:
                # Just update the database to match blockchain
                update_tx = "UPDATE electiondetails SET status='ended' WHERE electionid=?"
                mycursor.execute(update_tx, (election_id,))
                mydb.commit()
                mydb.close()

                print(f"✅ Election {election_id} already fully processed on blockchain. Database synchronized.")
                return jsonify({
                    "status": "success", 
                    "message": "Election was already ended with results declared. Database updated.",
                    "blockchain_state": "already_completed"
                })
                
            # Case 2: Inactive but results not declared
            if not is_active and not results_declared:
                print(f"⚠️ Election {election_id} is inactive but results not declared. Proceeding with results declaration only.")
                # Skip ending, go straight to declaring results
            
            # Case 3: Still active (need to end first, then declare)
            # This will be handled by the normal flow below
            
        except Exception as e:
            print(f"Error checking election state on blockchain: {str(e)}")
            # Continue with normal flow if we can't check blockchain state
        
        # Standard flow: Try to end the election first
        end_result = end_election_on_chain(election_id)
        
        # If the election is already inactive on the blockchain but active in the database,
        # we can still proceed with declaring results
        already_inactive = False
        if not end_result.get("success") and "already_inactive" not in end_result:
            mydb.close()
            return jsonify({"status": "error", "message": f"Failed to end election: {end_result.get('error')}"})
        elif end_result.get("already_inactive"):
            already_inactive = True
            print(f"📢 Election {election_id} was already inactive. Proceeding to declare results.")
        
        # Whether the election was newly ended or was already inactive, proceed with declaring results
        declare_result = declare_result_on_chain(election_id)
        
        if declare_result.get("success") or declare_result.get("already_declared"):
            # Update election status in database regardless of whether we had to end it or not
            update_tx = "UPDATE electiondetails SET status='ended' WHERE electionid=?"
            mycursor.execute(update_tx, (election_id,))
            mydb.commit()
            
            # Log the sync action
            if already_inactive or declare_result.get("already_declared"):
                print(f"✅ Synchronized database with blockchain for election {election_id}: marked as ended")
            else:
                print(f"✅ Successfully published election {election_id} results")
            
            mydb.close()
            return jsonify({
                "status": "success", 
                "message": "Election results published successfully",
                "end_tx": end_result.get("transaction_hash", "Election was already ended"),
                "declare_tx": declare_result.get("transaction_hash", "Results were already declared")
            })
        else:
            # If declaring results failed, we should still update the database
            # to reflect that the election is ended on the blockchain
            if already_inactive or end_result.get("success"):
                update_tx = "UPDATE electiondetails SET status='ended' WHERE electionid=?"
                mycursor.execute(update_tx, (election_id,))
                mydb.commit()
                print(f"⚠️ Election {election_id} marked as ended in database, but results declaration failed: {declare_result.get('error')}")
            
            mydb.close()
            # Special case - if we get "revert Election is already inactive" during result declaration,
            # it could mean the results are already declared but the contract doesn't tell us explicitly
            error_msg = str(declare_result.get('error', '')).lower()
            if "inactive" in error_msg or "already" in error_msg or "result date not reached" in error_msg:
                # Update the election in the database as ended anyway
                try:
                    mydb = connect()
                    mycursor = mydb.cursor()
                    update_tx = "UPDATE electiondetails SET status='ended' WHERE electionid=?"
                    mycursor.execute(update_tx, (election_id,))
                    mydb.commit()
                    mydb.close()
                except Exception as update_err:
                    print(f"Error updating election status: {str(update_err)}")
                
                return jsonify({
                    "status": "success", 
                    "message": "Election marked as ended in database despite blockchain error.",
                    "warning": f"Original error: {declare_result.get('error')}"
                })
            else:
                return jsonify({
                    "status": "error", 
                    "message": f"Failed to declare results: {declare_result.get('error')}"
                })
            
    except Exception as e:
        print(f"❌ Error in publishresult: {str(e)}")
        if 'mydb' in locals():
            mydb.close()
        return jsonify({"status": "error", "message": f"Server error: {str(e)}"})


@app.route('/evoting/login', methods=["POST"], strict_slashes=False)
def login():
    r = request.json
    mydb = connect()
    mycursor = mydb.cursor()

    try:
        if r.get("isAdmin"):
            # Admin login
            tx = "SELECT * FROM admin WHERE username=? AND password=?"
            mycursor.execute(tx, (r["emailid"], r["pass"]))
            admin = mycursor.fetchone()
            if admin:
                return json.dumps({"status": "success", "isAdmin": True, "username": admin[1]})
            else:
                return json.dumps({"status": "error", "message": "Invalid admin credentials"})
        else:
            # Voter login
            tx = "SELECT * FROM votermaster WHERE emailid=? AND password=? AND isapproved=1"
            mycursor.execute(tx, (r["emailid"], r["pass"]))
            voter = mycursor.fetchone()
            if voter:
                return json.dumps({"status": "success", "isAdmin": False, "data": voter})
            else:
                return json.dumps({"status": "error", "message": "Invalid credentials or account not approved"})
    except Exception as e:
        print(f"Login error: {str(e)}")
        return json.dumps({"status": "error", "message": "An error occurred during login"})
    finally:
        mydb.close()


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
    tx = "SELECT strftime('%Y', 'now') - strftime('%Y', dob) AS age,COUNT(strftime('%Y', 'now') - strftime('%Y', dob)) AS counts FROM votermaster GROUP BY age;"
    mycursor.execute(tx)
    e = mycursor.fetchall()
    print(e)
    mydb.close()
    return json.dumps(e)


@app.route('/evoting/ElectionResultPoliticalPartyWise', methods=["POST"], strict_slashes=False)
def ElectionResultPoliticalPartyWise():
    mydb = connect()
    mycursor = mydb.cursor()
    
    try:
        # First get list of elections with 'ended' status
        check_elections_query = "SELECT electionid FROM electiondetails WHERE status='ended'"
        mycursor.execute(check_elections_query)
        ended_elections = mycursor.fetchall()
        
        if not ended_elections:
            print("No elections with 'ended' status found")
            mydb.close()
            return json.dumps([])
        
        # Format list of election IDs for SQL query
        election_ids = ', '.join([str(election[0]) for election in ended_elections])
        
        # Modified query to directly get votes for ended elections
        tx = f"""
            SELECT cv.electionid, cv.nomitationID, COUNT(cv.nomitationID) as totalvote 
            FROM castvote cv
            JOIN electiondetails ed ON cv.electionid = ed.electionid
            WHERE ed.status = 'ended'
            GROUP BY cv.nomitationID, cv.electionid
        """
        
        mycursor.execute(tx)
        results = mycursor.fetchall()
        print(f"Found {len(results)} vote count records for ended elections")
        
        val = []
        for x in results:
            x = list(x)
            try:
                # Get election name
                get_election_query = "SELECT electionName FROM electiondetails WHERE electionid=?"
                mycursor.execute(get_election_query, (x[0],))
                election_result = mycursor.fetchone()
                if not election_result:
                    continue
                    
                x.append(election_result[0])
                
                # Get candidate and party info
                get_nomination_query = "SELECT voterid, politicalPartyID FROM electionnomitation WHERE nomitationID=?"
                mycursor.execute(get_nomination_query, (x[1],))
                nomination_result = mycursor.fetchone()
                if not nomination_result:
                    continue
                
                voter_id, party_id = nomination_result
                
                # Get candidate name and constituency
                get_voter_query = "SELECT firstname, constituencyID FROM votermaster WHERE voteid=?"
                mycursor.execute(get_voter_query, (voter_id,))
                voter_result = mycursor.fetchone()
                if not voter_result:
                    continue
                
                candidate_name, constituency_id = voter_result
                x.append(candidate_name)
                
                # Get party name
                get_party_query = "SELECT politicalPartyName FROM politicalpartymaster WHERE politicalPartyID=?"
                mycursor.execute(get_party_query, (party_id,))
                party_result = mycursor.fetchone()
                if not party_result:
                    x.append("Unknown Party")
                else:
                    x.append(party_result[0])
                
                # Get constituency name
                get_constituency_query = "SELECT constituencyName FROM constituencymaster WHERE constituencyID=?"
                mycursor.execute(get_constituency_query, (constituency_id,))
                constituency_result = mycursor.fetchone()
                if not constituency_result:
                    x.append("Unknown Constituency")
                else:
                    x.append(constituency_result[0])
                
                val.append(x)
            except Exception as e:
                print(f"Error processing result {x}: {str(e)}")

        print(f"Returning {len(val)} formatted election results")
        mydb.close()
        return json.dumps(val)
    except Exception as e:
        print(f"Error in ElectionResultPoliticalPartyWise: {str(e)}")
        if 'mydb' in locals():
            mydb.close()
        return json.dumps([])


@app.route('/evoting/ElectionResultBlockchain', methods=["POST"], strict_slashes=False)
def ElectionResultBlockchain():
    """Get election results directly from the blockchain"""
    r = request.json
    election_id = int(r["electionid"])
    
    # Get results from blockchain
    result = get_election_results_from_chain(election_id)
    
    if result["success"]:
        # Enrich with additional info from database
        mydb = connect()
        mycursor = mydb.cursor()
        
        for candidate in result["candidates"]:
            # Get political party name
            tx = "select politicalPartyName from politicalpartymaster where politicalPartyID='%s'" % (candidate["party_id"])
            mycursor.execute(tx)
            party = mycursor.fetchone()
            candidate["party_name"] = party[0] if party else "Unknown"
            
            # Get constituency name
            tx = "select constituencyName from constituencymaster where constituencyID='%s'" % (candidate["constituency_id"])
            mycursor.execute(tx)
            constituency = mycursor.fetchone()
            candidate["constituency_name"] = constituency[0] if constituency else "Unknown"
        
        mydb.close()
        return jsonify(result)
    else:
        return jsonify({"status": "error", "message": result["error"]})


def generate_verification_token():
    """Generate a secure verification token"""
    return secrets.token_urlsafe(32)

def send_verification_email(email, token):
    """Send verification email with token"""
    verification_link = f"{BASE_URL}/evoting/verify_email?token={token}"
    message = f"""Subject: Verify Your Email for E-Voting System

Dear Voter,

Please click the following link to verify your email address:
{verification_link}

This link will expire in 24 hours.

If you did not register for this service, please ignore this email.

Best regards,
E-Voting System Team
"""
    sendmail(email, message)

@app.route('/evoting/verify_email', methods=['GET'])
def verify_email():
    """Verify email using token"""
    token = request.args.get('token')
    if not token:
        return jsonify({"status": "error", "message": "No token provided"})
    
    if token not in verification_tokens:
        return jsonify({"status": "error", "message": "Invalid or expired token"})
    
    voter_data = verification_tokens[token]
    if time.time() > voter_data['expires']:
        del verification_tokens[token]
        return jsonify({"status": "error", "message": "Token has expired"})
    
    # Update email verification status in database
    mydb = connect()
    mycursor = mydb.cursor()
    
    try:
        # Update the email_verified status to 1
        sql = "UPDATE votermaster SET email_verified = 1 WHERE emailID = ?"
        mycursor.execute(sql, (voter_data['emailID'],))
        mydb.commit()
        
        # Clean up the token
        del verification_tokens[token]
        
        return jsonify({
            "status": "success",
            "message": "Email verified successfully"
        })
    except Exception as e:
        mydb.rollback()
        return jsonify({
            "status": "error",
            "message": f"Error updating verification status: {str(e)}"
        })
    finally:
        mydb.close()

@app.route('/evoting/resend_verification', methods=['POST'])
def resend_verification():
    """Resend verification email for unverified users"""
    try:
        data = request.json
        email = data.get('email')
        
        if not email:
            return jsonify({
                "status": "error",
                "message": "Email is required"
            })
        
        # Check if user exists and needs verification
        mydb = connect()
        mycursor = mydb.cursor()
        
        try:
            mycursor.execute("SELECT email_verified FROM votermaster WHERE emailID=?", (email,))
            result = mycursor.fetchone()
            
            if not result:
                return jsonify({
                    "status": "error",
                    "message": "Email not found. Please register first."
                })
            
            if result[0] == 1:
                return jsonify({
                    "status": "error",
                    "message": "Email is already verified"
                })
            
            # Generate new verification token
            token = generate_verification_token()
            
            # Store token with minimal data needed
            verification_tokens[token] = {
                'emailID': email,
                'expires': time.time() + 86400  # 24 hours
            }
            
            # Send new verification email
            send_verification_email(email, token)
            
            return jsonify({
                "status": "success",
                "message": "Verification email has been resent. Please check your inbox."
            })
            
        except Exception as e:
            return jsonify({
                "status": "error",
                "message": f"Database error: {str(e)}"
            })
        finally:
            mydb.close()
            
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"Server error: {str(e)}"
        })

@app.route('/evoting/checkmobile', methods=['POST'])
def check_mobile():
    try:
        data = request.json
        mobileNbr = data.get('mobileNbr')
        
        if not mobileNbr:
            return jsonify({'status': 'error', 'message': 'Mobile number is required'})
            
        mydb = connect()
        mycursor = mydb.cursor()
        
        # Check if mobile number exists
        mycursor.execute("SELECT COUNT(*) FROM votermaster WHERE mobileNbr = ?", (mobileNbr,))
        count = mycursor.fetchone()[0]
        
        mydb.close()
        
        return jsonify({
            'exists': count > 0
        })
        
    except Exception as e:
        print(f"Error checking mobile number: {str(e)}")
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500

@app.route('/evoting/checkemail', methods=['POST'])
def check_email():
    try:
        data = request.json
        emailID = data.get('emailID')
        
        if not emailID:
            return jsonify({'status': 'error', 'message': 'Email is required'})
            
        mydb = connect()
        mycursor = mydb.cursor()
        
        # Check if email exists
        mycursor.execute("SELECT COUNT(*) FROM votermaster WHERE emailID = ?", (emailID,))
        count = mycursor.fetchone()[0]
        
        mydb.close()
        
        return jsonify({
            'exists': count > 0
        })
        
    except Exception as e:
        print(f"Error checking email: {str(e)}")
        return jsonify({'status': 'error', 'message': 'Internal server error'}), 500

# REST API aliases for modern clients
@app.route('/api/elections', methods=['GET'])
def get_elections_api():
    return viewelectiondetails()

@app.route('/api/elections', methods=['POST'])
def create_election_api():
    return insertelectiondetails()

@app.route('/api/elections/<int:id>', methods=['DELETE'])
def delete_election_api(id):
    request.json = {'id': id}
    return deleteelectiondetails()

@app.route('/api/nominations', methods=['GET'])
def get_nominations_api():
    return viewelectionnomitation()

@app.route('/api/nominations', methods=['POST'])
def create_nomination_api():
    return insertelectionnomitation()

@app.route('/api/voters/pending', methods=['GET'])
def get_pending_voters_api():
    return viewpendingvoters()

@app.route('/evoting/debug_all_blockchain_elections', methods=["GET"])
def debug_all_blockchain_elections():
    try:
        contract = get_contract()
        if not contract:
            return jsonify({"status": "error", "message": "Contract not available"})

        election_count = contract.functions.electionCount().call()
        all_elections = []

        for i in range(1, election_count + 1):
            election = contract.functions.getElection(i).call()
            all_elections.append({
                "election_id": election[0],
                "name": election[1],
                "nomination_end": election[2],
                "nomination_end_readable": datetime.datetime.fromtimestamp(election[2], tz=datetime.timezone.utc).isoformat(),
                "election_date": election[3],
                "election_date_readable": datetime.datetime.fromtimestamp(election[3], tz=datetime.timezone.utc).isoformat(),
                "result_date": election[4],
                "result_date_readable": datetime.datetime.fromtimestamp(election[4], tz=datetime.timezone.utc).isoformat(),
                "is_active": election[5],
                "result_declared": election[6]
            })

        return jsonify({
            "status": "success",
            "elections": all_elections
        })

    except Exception as e:
        print(f"Error debugging blockchain elections: {str(e)}")
        return jsonify({"status": "error", "message": str(e)})

@app.route("/routes")
def list_routes():
    import urllib
    output = []
    for rule in app.url_map.iter_rules():
        methods = ','.join(rule.methods)
        line = urllib.parse.unquote(f"{rule.endpoint:50s} {methods:20s} {str(rule)}")
        output.append(line)
    return "<br>".join(sorted(output))

@app.route('/evoting/deletenomination', methods=["POST"])
def delete_nomination():
    try:
        data = request.json
        nomination_id = data.get('nominationId')
        
        if not nomination_id:
            return jsonify({
                "status": "error",
                "message": "Nomination ID is required"
            }), 400
            
        mydb = connect()
        mycursor = mydb.cursor()
        
        # First check if the nomination exists and get election details
        check_query = """
            SELECT en.nomitationID, ed.nominationLastDate, ed.effDate, ed.status
            FROM electionnomitation en
            JOIN electiondetails ed ON en.electionID = ed.electionID
            WHERE en.nomitationID = ?
        """
        mycursor.execute(check_query, (nomination_id,))
        nomination_data = mycursor.fetchone()
        
        if not nomination_data:
            mydb.close()
            return jsonify({
                "status": "error",
                "message": "Nomination not found"
            }), 404
            
        # Check if the election has started or ended
        current_date = datetime.date.today()
        nomination_last_date = datetime.datetime.strptime(nomination_data[1], '%Y-%m-%d').date()
        
        if current_date > nomination_last_date:
            mydb.close()
            return jsonify({
                "status": "error",
                "message": "Cannot delete nomination after nomination period has ended"
            }), 400
            
        if nomination_data[3] == 'ended':
            mydb.close()
            return jsonify({
                "status": "error",
                "message": "Cannot delete nomination from an ended election"
            }), 400
            
        # If all checks pass, delete the nomination
        delete_query = "DELETE FROM electionnomitation WHERE nomitationID = ?"
        mycursor.execute(delete_query, (nomination_id,))
        mydb.commit()
        mydb.close()
        
        return jsonify({
            "status": "success",
            "message": "Nomination deleted successfully"
        })
        
    except Exception as e:
        print(f"Error deleting nomination: {str(e)}")
        if 'mydb' in locals():
            mydb.close()
        return jsonify({
            "status": "error",
            "message": f"Server error: {str(e)}"
        }), 500

if __name__ == '__main__':
    # First try to deploy the contract if it's not already deployed
    if CONTRACT_ADDRESS is None:
        compile_and_deploy_contract()
    
    # Run with debug=True to enable auto-restart on code changes
    app.run(host="0.0.0.0", port=5000, debug=True)
