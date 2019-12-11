import psycopg2
import ssl
import asyncio
import asyncpg
import evdev
from evdev import InputDevice, categorize, ecodes  

async def db():
    print("connecting database")
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    conn = await asyncpg.connect(
        ssl=ctx,
        user = "uhopreslzwqqgk",  
        password = "187ea5a6989ad1310428df3421fcd299d375092ee6be71200ac5441213c81c90",
        host = "ec2-184-72-223-163.compute-1.amazonaws.com",
        port = "5432",
        database = "di5nkckc27n04")
    return conn


async def device():
    print("connecting device")
    dev = InputDevice('/dev/input/event23')
    # sudo chmod 777 /dev/input/event10
    dev.grab()
    return dev

async def insertScan(connection,scan):
    async with connection.transaction():
       await connection.execute("INSERT INTO scanned (scan) VALUES ('"+str(scan)+"')")


async def worker(q,connection):
    print("inserter start")
    while True:
        value = await q.get()
        #INSERT NOW
        async with connection.transaction():
            await connection.execute("INSERT INTO scanned (scan) VALUES ('"+str(value)+"')")
        print(value)
        #await asyncio.sleep(1)


async def scanner(q,dev):
    print("Scanner Start")
    scan = ''
    caps = False
    async for ev in dev.async_read_loop():
        if ev.type == ecodes.EV_KEY:
                    data = categorize(ev)  # Save the event temporarily to introspect it
                    if data.scancode == 42:
                        if data.keystate == 1:
                            caps = True
                        if data.keystate == 0:
                            caps = False
                    if data.keystate == 1:
                        if caps:
                            key_lookup = '{}'.format(capscodes.get(data.scancode)) or 'UNKNOWN:[{}]'.format(data.scancode)  # Lookup or return UNKNOWN:XX
                        else:
                            key_lookup = '{}'.format(scancodes.get(data.scancode)) or 'UNKNOWN:[{}]'.format(data.scancode)  # Lookup or return UNKNOWN:XX
                        if (data.scancode != 42) and (data.scancode != 28):
                            scan += key_lookup  
                        if(data.scancode == 28):
                            #ADD to Postgres InsertTask
                            await q.put(scan)
                            #print(scan+)
                            scan=""




async def main():
    print("start main")
    q = asyncio.Queue()
    connection ,dev= await asyncio.gather(db(),device())
    await asyncio.gather(worker(q,connection),scanner(q,dev))

    #asyncio.create_task(scanner(q,dev,connection))





scancodes = {
    # Scancode: ASCIICode
    0: None, 1: 'ESC', 2: '1', 3: '2', 4: '3', 5: '4', 6: '5', 7: '6', 8: '7', 9: '8',
    10: '9', 11: '0', 12: '-', 13: '=', 14: 'BKSP', 15: 'TAB', 16: 'q', 17: 'w', 18: 'e', 19: 'r',
    20: 't', 21: 'y', 22: 'u', 23: 'i', 24: 'o', 25: 'p', 26: '[', 27: ']', 28: 'CRLF', 29: 'LCTRL',
    30: 'a', 31: 's', 32: 'd', 33: 'f', 34: 'g', 35: 'h', 36: 'j', 37: 'k', 38: 'l', 39: ';',
    40: '"', 41: '`', 42: 'LSHFT', 43: '\\', 44: 'z', 45: 'x', 46: 'c', 47: 'v', 48: 'b', 49: 'n',
    50: 'm', 51: ',', 52: '.', 53: '/', 54: 'RSHFT', 56: 'LALT', 57: ' ', 100: 'RALT'
}

capscodes = {
    0: None, 1: 'ESC', 2: '!', 3: '@', 4: '#', 5: '$', 6: '%', 7: '^', 8: '&', 9: '*',
    10: '(', 11: ')', 12: '_', 13: '+', 14: 'BKSP', 15: 'TAB', 16: 'Q', 17: 'W', 18: 'E', 19: 'R',
    20: 'T', 21: 'Y', 22: 'U', 23: 'I', 24: 'O', 25: 'P', 26: '{', 27: '}', 28: 'CRLF', 29: 'LCTRL',
    30: 'A', 31: 'S', 32: 'D', 33: 'F', 34: 'G', 35: 'H', 36: 'J', 37: 'K', 38: 'L', 39: ':',
    40: '\'', 41: '~', 42: 'LSHFT', 43: '|', 44: 'Z', 45: 'X', 46: 'C', 47: 'V', 48: 'B', 49: 'N',
    50: 'M', 51: '<', 52: '>', 53: '?', 54: 'RSHFT', 56: 'LALT',  57: ' ', 100: 'RALT'
}



#setup vars


#grab provides exclusive access to the device

#print ( connection.get_dsn_parameters(),"\n")

# Print PostgreSQL version
#cursor.execute("SELECT version();")
#record = cursor.fetchone()
#print("You are connected to - ", record,"\n")

#loop

# Print PostgreSQL Connection properties

asyncio.run(main())