--!/usr/bin/env lua

local heartbeatsKey = KEYS[1]
local timestamp = tonumber(ARGV[1])
local timeout = tonumber(ARGV[2])

local heartbeats = redis.call("HGETALL", heartbeatsKey)
local result = {}
for i=1,#heartbeats,2 do
  local nodeid = heartbeats[i]
  local heartbeat = heartbeats[i + 1]

  if timestamp - tonumber(heartbeat) > timeout then
    redis.call("HDEL", heartbeatsKey, nodeid)
    result[#result + 1] = nodeid
  end
end

return result
