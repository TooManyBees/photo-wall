require 'json'
if File.exist?('./aws.json')
  print "Reading AWS configuration into ENV. "
  json = JSON.parse(File.read('aws.json'))
  json.each do |var, val|
    print "Got #{var}... "
    ENV[var] = val
  end
  puts
end

require './root'
run Sinatra::Application
