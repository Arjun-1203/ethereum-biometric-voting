// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VotingSystem {
    // Structures
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedElection;
        uint votedCandidate;
    }
    
    struct Candidate {
        uint id;
        string name;
        uint partyId;
        uint constituencyId;
        uint voteCount;
    }
    
    struct Election {
        uint id;
        string name;
        uint nominationEndDate;
        uint electionDate;
        uint resultDate;
        bool isActive;
        bool resultDeclared;
    }
    
    // State variables
    mapping(address => Voter) public voters;
    mapping(uint => mapping(uint => Candidate)) public candidates; // electionId => candidateId => Candidate
    mapping(uint => Election) public elections;
    mapping(uint => uint) public candidateCount;
    
    uint public electionCount;
    address public admin;
    
    // Events
    event VoterRegistered(address voterAddress);
    event ElectionCreated(uint electionId, string name);
    event CandidateRegistered(uint electionId, uint candidateId, string name, uint partyId);
    event VoteCast(address voter, uint electionId, uint candidateId);
    event ElectionStatusChanged(uint electionId, bool isActive);
    event ResultDeclared(uint electionId);
    
    // Modifiers
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }
    
    modifier activeElection(uint _electionId) {
        require(elections[_electionId].isActive, "Election is not active");
        _;
    }
    
    // Constructor
    constructor() {
        admin = msg.sender;
        electionCount = 0;
    }
    
    // Functions
    
    // Register a voter
    function registerVoter(address _voter) public onlyAdmin {
        require(!voters[_voter].isRegistered, "Voter already registered");
        
        voters[_voter].isRegistered = true;
        voters[_voter].hasVoted = false;
        
        emit VoterRegistered(_voter);
    }
    
    // Create a new election
    function createElection(
        string memory _name,
        uint _nominationEndDate,
        uint _electionDate,
        uint _resultDate
    ) public onlyAdmin {
        electionCount++;
        
        elections[electionCount] = Election({
            id: electionCount,
            name: _name,
            nominationEndDate: _nominationEndDate,
            electionDate: _electionDate,
            resultDate: _resultDate,
            isActive: true,
            resultDeclared: false
        });
        
        candidateCount[electionCount] = 0;
        
        emit ElectionCreated(electionCount, _name);
    }
    
    // Register a candidate for an election
    function registerCandidate(
        uint _electionId,
        string memory _name,
        uint _partyId,
        uint _constituencyId
    ) public onlyAdmin {
        require(_electionId > 0 && _electionId <= electionCount, "Invalid election ID");
        require(elections[_electionId].isActive, "Election is not active");
        require(block.timestamp < elections[_electionId].nominationEndDate, "Nomination period ended");
        
        candidateCount[_electionId]++;
        uint candidateId = candidateCount[_electionId];
        
        candidates[_electionId][candidateId] = Candidate({
            id: candidateId,
            name: _name,
            partyId: _partyId,
            constituencyId: _constituencyId,
            voteCount: 0
        });
        
        emit CandidateRegistered(_electionId, candidateId, _name, _partyId);
    }
    
    // Cast a vote
    function castVote(uint _electionId, uint _candidateId) public activeElection(_electionId) {
        require(voters[msg.sender].isRegistered, "Voter not registered");
        require(!voters[msg.sender].hasVoted, "Voter has already voted");
        require(_electionId > 0 && _electionId <= electionCount, "Invalid election ID");
        require(_candidateId > 0 && _candidateId <= candidateCount[_electionId], "Invalid candidate ID");
        require(block.timestamp >= elections[_electionId].electionDate, "Election has not started yet");
        require(block.timestamp < elections[_electionId].resultDate, "Election has ended");
        
        voters[msg.sender].hasVoted = true;
        voters[msg.sender].votedElection = _electionId;
        voters[msg.sender].votedCandidate = _candidateId;
        
        candidates[_electionId][_candidateId].voteCount++;
        
        emit VoteCast(msg.sender, _electionId, _candidateId);
    }
    
    // End an election
    function endElection(uint _electionId) public onlyAdmin {
        require(_electionId > 0 && _electionId <= electionCount, "Invalid election ID");
        require(elections[_electionId].isActive, "Election is already inactive");
        
        elections[_electionId].isActive = false;
        
        emit ElectionStatusChanged(_electionId, false);
    }
    
    // Declare results for an election
    function declareResult(uint _electionId) public onlyAdmin {
        require(_electionId > 0 && _electionId <= electionCount, "Invalid election ID");
        require(!elections[_electionId].isActive, "Election is still active");
        require(!elections[_electionId].resultDeclared, "Result already declared");
        require(block.timestamp >= elections[_electionId].resultDate, "Result date not reached");
        
        elections[_electionId].resultDeclared = true;
        
        emit ResultDeclared(_electionId);
    }
    
    // Get candidate details
    function getCandidate(uint _electionId, uint _candidateId) public view returns (
        uint id,
        string memory name,
        uint partyId,
        uint constituencyId,
        uint voteCount
    ) {
        require(_electionId > 0 && _electionId <= electionCount, "Invalid election ID");
        require(_candidateId > 0 && _candidateId <= candidateCount[_electionId], "Invalid candidate ID");
        
        Candidate memory candidate = candidates[_electionId][_candidateId];
        
        return (
            candidate.id,
            candidate.name,
            candidate.partyId,
            candidate.constituencyId,
            candidate.voteCount
        );
    }
    
    // Get election details
    function getElection(uint _electionId) public view returns (
        uint id,
        string memory name,
        uint nominationEndDate,
        uint electionDate,
        uint resultDate,
        bool isActive,
        bool resultDeclared
    ) {
        require(_electionId > 0 && _electionId <= electionCount, "Invalid election ID");
        
        Election memory election = elections[_electionId];
        
        return (
            election.id,
            election.name,
            election.nominationEndDate,
            election.electionDate,
            election.resultDate,
            election.isActive,
            election.resultDeclared
        );
    }
    
    // Get number of candidates in an election
    function getCandidateCount(uint _electionId) public view returns (uint) {
        require(_electionId > 0 && _electionId <= electionCount, "Invalid election ID");
        
        return candidateCount[_electionId];
    }
    
    // Check if a voter has voted
    function hasVoted(address _voter) public view returns (bool) {
        return voters[_voter].hasVoted;
    }
    
    // Get candidate vote count
    function getVoteCount(uint _electionId, uint _candidateId) public view returns (uint) {
        require(_electionId > 0 && _electionId <= electionCount, "Invalid election ID");
        require(_candidateId > 0 && _candidateId <= candidateCount[_electionId], "Invalid candidate ID");
        
        return candidates[_electionId][_candidateId].voteCount;
    }
} 