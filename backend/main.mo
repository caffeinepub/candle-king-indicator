import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  type PatternConfig = {
    symbol : Text;
    patternName : Text;
    enabled : Bool;
    confidenceThreshold : Nat;
  };

  type SignalHistoryEntry = {
    symbol : Text;
    timeframe : Text;
    patternName : Text;
    signalType : Text;
    confidence : Nat;
    timestamp : Time.Time;
  };

  let patternConfigs = List.empty<PatternConfig>();
  let signalHistory = List.empty<SignalHistoryEntry>();
  let maxSignalHistory = 50;

  public shared ({ caller }) func savePatternConfig(symbol : Text, patternName : Text, enabled : Bool, confidenceThreshold : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save pattern configurations");
    };
    let newConfig : PatternConfig = {
      symbol;
      patternName;
      enabled;
      confidenceThreshold;
    };
    let filtered = patternConfigs.toArray()
      |> _.filter(func(config : PatternConfig) : Bool {
        not (config.symbol == symbol and config.patternName == patternName)
      });
    patternConfigs.clear();
    for (config in filtered.vals()) {
      patternConfigs.add(config);
    };
    patternConfigs.add(newConfig);
    while (patternConfigs.size() > 50) {
      ignore patternConfigs.removeLast();
    };
  };

  public query ({ caller }) func getPatternConfigs() : async [PatternConfig] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can retrieve pattern configurations");
    };
    patternConfigs.toArray();
  };

  public shared ({ caller }) func saveSignalHistory(symbol : Text, timeframe : Text, patternName : Text, signalType : Text, confidence : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save signal history");
    };
    let newEntry : SignalHistoryEntry = {
      symbol;
      timeframe;
      patternName;
      signalType;
      confidence;
      timestamp = Time.now();
    };
    signalHistory.add(newEntry);
    while (signalHistory.size() > maxSignalHistory) {
      ignore signalHistory.removeLast();
    };
  };

  public query ({ caller }) func getSignalHistory() : async [SignalHistoryEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can retrieve signal history");
    };
    signalHistory.toArray();
  };

  public query ({ caller }) func getRecentSignalHistory(limit : Nat) : async [SignalHistoryEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can retrieve signal history");
    };
    let actualLimit = if (limit < maxSignalHistory) { limit } else {
      maxSignalHistory;
    };
    let entries = signalHistory.toArray();
    if (entries.size() <= actualLimit) {
      entries;
    } else {
      Array.tabulate<SignalHistoryEntry>(actualLimit, func(i) { entries[i] });
    };
  };
};
