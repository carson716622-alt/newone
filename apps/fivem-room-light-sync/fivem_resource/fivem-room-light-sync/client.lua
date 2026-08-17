local lastState = nil

local function getEmergencyState()
    local ped = PlayerPedId()
    if not DoesEntityExist(ped) or not IsPedInAnyVehicle(ped, false) then
        return false
    end

    local vehicle = GetVehiclePedIsIn(ped, false)
    if vehicle == 0 or not DoesEntityExist(vehicle) then
        return false
    end

    -- IsVehicleSirenOn reports whether the current vehicle's emergency lights/sirens are enabled.
    return IsVehicleSirenOn(vehicle)
end

local function publishState(active)
    PerformHttpRequest(
        Config.Endpoint,
        function(statusCode, body, headers, errorData)
            if statusCode ~= 200 then
                print(('[fivem-room-light-sync] Desktop app did not accept state update (HTTP %s).'):format(tostring(statusCode)))
            end
        end,
        'POST',
        json.encode({ active = active }),
        {
            ['Content-Type'] = 'application/json',
            ['X-FRLS-Token'] = Config.Token
        }
    )
end

CreateThread(function()
    while true do
        local active = getEmergencyState()
        if active ~= lastState then
            lastState = active
            publishState(active)
        end
        Wait(Config.PollIntervalMs or 250)
    end
end)
