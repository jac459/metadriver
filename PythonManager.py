#!/usr/bin/env python

import asyncio
import websockets
from urllib.parse import urlparse, parse_qs
from adb_shell.adb_device import AdbDeviceTcp, AdbDeviceUsb
from adb_shell.auth.sign_pythonrsa import PythonRSASigner

import logging
import time

#logger = logging.getLogger('websockets')
#logging.basicConfig(level=logging.INFO)
#logger = logging.getLogger(__name__)

logger = logging.getLogger('websockets')
logger.setLevel(logging.INFO)

# create console handler and set level to debug
ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)

# create formatter
formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")

# add formatter to ch
ch.setFormatter(formatter)

# add ch to logger
logger.addHandler(ch)


ConnectedHosts = []
ADBHostList = {}
BroadlinkHostList = []
# AdbDeviceTcp(1,555,default_transport_timeout_s=9.)
def DateAndTime():
    return time.strftime("%Y-%m-%d %H:%M:%S")

def Connect_ADB(host):
    global ADBDevice
    global ConnectedHosts
    logger.info("ADB_Driver: connecting to host: "+host)
    try:                                            # Checking if we are already connected.
       ADBDevice = ADBHostList[host]["ADBSocket"]       
       return 
    except:
        logger.info("Setting up connection ADB with "+host)

    ADBDevice = AdbDeviceTcp(host, 5555, default_transport_timeout_s=5.)
    ## Load the public and private keys so we can connect to Android and authenticate ourself (also for future use) 
    adbkey = '/home/neeo/ADB_Shell_key'
    with open(adbkey) as f:
        priv = f.read()

    with open(adbkey + '.pub') as f:
        pub = f.read()
    signer = PythonRSASigner(pub, priv)

    ADBDevice.connect(rsa_keys=[signer],auth_timeout_s=5)

    ADBHostList.setdefault(host, {})["ADBSocket"] = ADBDevice
    logger.info("Hostlist is now ")
    logger.info(ADBHostList)

    return 
    
def Send_ADB(Command,AsRoot,host ):
    global ADBDevice

    if AsRoot == 'yes':
        Response = ADBDevice.root()
    Response = ADBDevice.shell(Command)
    return Response

def ADB(Arguments): 
    global ADBDevice
    global ConnectedHosts
    Parms = ["asroot","host","command"]
    MyParm = []
    # following code will fill list MyParm with the passed arguments, "" is param is not supplied: 1=asroot,2=host,3=command
    isRequired = False      # first parameter `(asroot) isn't required
    for x in range(len(Parms)):
        try:
            MyParm.append(Arguments[Parms[x]][0]) 
        except Exception as err:
            MyParm.append("") # mzke sure the number of parameters in list  is okay.
            if isRequired:
                logger.error("An exception occurred, no " + Parms[x] +" parameter was provided")
                return "An exception occurred, no " + Parms[x] + " parameter was provided"
        isRequired = True
        
    Connect_ADB(MyParm[1])      # Call connect function, that will see if we actually need to connect or reuse an existing connection

    MyResponse = Send_ADB(MyParm[2],MyParm[0],MyParm[1]) # Command,AsRoot,host
    return MyResponse

## below code is the actual code for handling Broadlink-methods
def format_durations(data):
    result = ''
    for i in range(0, len(data)):
        if len(result) > 0:
            result += ' '
        result += ('+' if i % 2 == 0 else '-') + str(data[i])
    return result

def to_microseconds(bytes):
    result = []
    #  print bytes[0] # 0x26 = 38for IR
    index = 4
    while index < len(bytes):
        chunk = bytes[index]
        index += 1
        if chunk == 0:
            chunk = bytes[index]
            chunk = 256 * chunk + bytes[index + 1]
            index += 2
        result.append(int(round(chunk * TICK)))
        if chunk == 0x0d05:
            break
    return result

def lirc2gc(cmd):
    result = "" 
    NextByte=False 
    for code in cmd:  # .split(" "):
        if NextByte:
            result+=","
        else:
            NextByte=True
        result += str(round(abs(int(int(code)*0.038400))))
    return "sendir,1:1,1,38400,3,1,"+result

def gc2lirc(gccmd):
    frequency = int(gccmd.split(",")[3])*1.0/1000000
    pulses = gccmd.split(",")[6:]
    return [int(round(int(code) / frequency)) for code in pulses]

def lirc2broadlink(pulses):
    array = bytearray()

    for pulse in pulses:
        pulse = math.floor(pulse * 269 / 8192)  # 32.84ms units

        if pulse < 256:
            array += bytearray(struct.pack('>B', pulse))  # big endian (1-byte)
        else:
            array += bytearray([0x00])  # indicate next number is 2-bytes
            array += bytearray(struct.pack('>H', pulse))  # big endian (2-bytes)

    packet = bytearray([0x26, 0x00])  # 0x26 = IR, 0x00 = no repeats
    packet += bytearray(struct.pack('<H', len(array)))  # little endian byte count
    packet += array
    packet += bytearray([0x0d, 0x05])  # IR terminator

    # Add 0s to make ultimate packet size a multiple of 16 for 128-bit AES encryption.
    remainder = (len(packet) + 4) % 16  # rm.send_data() adds 4-byte header (02 00 00 00)
    if remainder:
        packet += bytearray(16 - remainder)

    return packet


def Convert_GC_to_Broadlink(stream): 

    pulses = gc2lirc(stream)
    packet = lirc2broadlink(pulses)
    pcodes = [int(binascii.hexlify(packet[i:i+2]), 16) for i in range(0, len(packet), 2)]
    #result = commandname.replace(' ', '_').replace('/','_').lower() +" "+ binascii.b2a_hex(packet).decode('utf-8')
    result = binascii.b2a_hex(packet).decode('utf-8')
    return result 

def Convert_Broadlink_to_GC(stream): 
    logger.info("Connect_Broadlink....")
    #First convert Broadlink-format to Lirc
    data = bytearray.fromhex(''.join(stream))
    durations = to_microseconds(data)
    logger.info("Broadlink: durations ")
    logger.info(durations)
    #Then convert format from Lirc to GC
    result = lirc2gc(durations)
    return result


# broadlink 26004600949412371237123712121212121212121212123712371237121212121212121212121237123712371212121212121212121212121212121212371237123712371237120006050d05
# LIRC Pulses: [4521, 4521, 555, 1692, 555, 1692, 555, 1692, 555, 555, 555, 555, 555, 555, 555, 555, 555, 555, 555, 1692, 555, 1692, 555, 1692, 555, 555, 555, 555, 555, 555, 555, 555, 555, 555, 555, 1692, 555, 1692, 555, 1692, 555, 555, 555, 555, 555, 555, 555, 555, 555, 555, 555, 555, 555, 555, 555, 555, 555, 1692, 555, 1692, 555, 1692, 555, 1692, 555, 1692, 555, 46953]
# GC 'sendir,1:1,1,37825,1,1,171,171,21,64,21,64,21,64,21,21,21,21,21,21,21,21,21,21,21,64,21,64,21,64,21,21,21,21,21,21,21,21,21,21,21,64,21,64,21,64,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,64,21,64,21,64,21,64,21,64,21,1776'


def Connect_Broadlink(Arguments):
   logger.info("Connect_Broadlink....")
   #host = request.args.get('host')
   #type = int(request.args.get('type'),16) 
   #mac  = bytearray.fromhex(request.args.get('mac'))
   host = Arguments["host"][0]
   type = int(Arguments["type"][0],16)
   mac = bytearray.fromhex(Arguments["mac"][0])
   logger.info("host, type, mac: " +host +" "  + type + " " + mac)
   dev = broadlink.gendevice(type, (host, 80), mac)
   logger.info("We have a device") 
   dev.auth()
   logger.info('dev=')
   logger.info(dev)
   return dev

def _xmit(Arguments):
    logger.info("Broadlink_Driver: xmit-request")

    dev = Connect_Broadlink(Arguments)  
    logger.info("Broadlink_Driver: Connection to Broadlink succeeded")
    #data = request.args.get('stream')
    data = Arguments["stream"][0]
    logger.info("Broadlink_Driver: Sending data " + data)
    SendThis = bytearray.fromhex(data)
    dev.send_data(SendThis)
    return 'OK'

def _xmitGC(Arguments):
    logger.info("Broadlink_Driver: Send GC requested")
    dev = Connect_Broadlink()  
    logger.info("Broadlink_Driver: Connection to Broadlink succeeded")
    #data = request.args.get('stream')
    data = Arguments["stream"][0]
    logger.info("Broadlink_Driver: Input data " + data)

    # Now convert the Global Cache format to our format
    logger.info("Broadlink_Driver: GC data "+ data)    
    ConvData = Convert_GC_to_Broadlink(data)    
    logger.info("Broadlink_Driver: Conversion done, sending this data "+ ConvData)
    SendThis = bytearray.fromhex(ConvData)
    dev.send_data(SendThis)
    return 'OK'

def ConvertBroadtoGC(Stream):
    logger.info("Broadlink_Driver: Conversion GC to Broadlink  requested")
    # Now convert the Global Cache format to our format
    ConvData = Convert_GC_to_Broadlink(Stream)    
    logger.info("Broadlink_Driver: Conversion done, returning this data " + ConvData)
    #SendThis = bytearray.fromhex(ConvData)
    SendThis = ConvData    
    return SendThis

def BroadtoGC(Arguments):
    logger.info("Broadlink_Driver: Conversion Broadlink to GC  requested")
    #data = request.args.get('stream')
    data = Arguments["stream"][0]
    logger.info("Broadlink_Driver: Input data " + data)
    ConvData = ConvertBroadtoGC(data)
    # Now convert the Global Cache format to our format
    logger.info("Broadlink_Driver: GC data " + ConvData)    
    return ConvData 

def _rcve(Arguments):
    #data = request.args.get['stream']
    logger.info("Broadlink_Driver: Learning requested")
    dev = Connect_Broadlink()
    logger.info("Broadlink_Driver: Connection to Broadlink succeeded")    
    logger.info("Broadlink_Driver: Learning for" + TIMEOUT +"ms")
    dev.enter_learning()
    start = time.time()
    while time.time() - start < TIMEOUT:
        time.sleep(1)
        try:
            data = dev.check_data()
        except (ReadError, StorageError):
            continue
        else:
            break
    else:
        #logger.info("No data received...")
        return 'timeout'
    Learned = ''.join(format(x, '02x') for x in bytearray(data))
    logger.info("Broadlink_Driver: Learned:"+ Learned)
    return Learned

def _rcveGC(Arguments):
    logger.info("rcveGC....")

    Learned=_rcve()
    return ConvertBroadtoGC(Learned)


def Validate_Method(Arguments):
    try:
        MyMethod = Arguments["method"][0]
    except:
        logger.info("Missing method, returning unsuccessful request")
        return "Exception: Missing method"

    MyMethod = MyMethod.lower()
    logger.info("Method = "+MyMethod)
    if MyMethod ==  "adb": 
        return ADB(Arguments) 
    elif MyMethod ==  "xmit":
        return _xmit(Arguments) 
    elif MyMethod ==  "xmitgc": 
        return _xmitGC(Arguments) 
    elif MyMethod ==  ("gctobroad"):
        return ConvertBroadtoGC(Arguments) 
    elif MyMethod ==  ("broadtogc"):
        return BroadtoGC(Arguments) 
    elif MyMethod ==  ("rcve"):
        return _rcve(Arguments) 
    elif MyMethod ==  ("rcvegc"):
        return _rcveGC(Arguments) 
    else:
        logger.error("Exception....")
        return "Exception, unknown method: " + MyMethod

async def Determine_Method(websocket,path): 
    try:
        async for message in websocket:
           Arguments = parse_qs(message)
           MyResponse = Validate_Method(Arguments) 
           await websocket.send(MyResponse)
    except websockets.ConnectionClosed as exc:
          logger.info('Connection with .Meta closed')
          logger.info(exc)

asyncio.get_event_loop().run_until_complete(
    websockets.serve(Determine_Method, 'localhost', 8765))
logger.info("Accepting websocket-connections on port 8765")
asyncio.get_event_loop().run_forever()
