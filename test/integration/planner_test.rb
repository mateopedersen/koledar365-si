require 'test_helper'
class PlannerIntegrationTest < ActionDispatch::IntegrationTest
  test 'countdown handles valid zones and refuses nonexistent DST time' do
    post '/izracun/',params:{tool:'countdown',date:'2027-03-28',time:'02:30',zone:'Europe/Ljubljana'},as: :json
    assert_response :unprocessable_entity
    post '/izracun/',params:{tool:'countdown',date:'2027-03-28',time:'04:00',zone:'Europe/Ljubljana'},as: :json
    assert_response :success
    assert_equal '2027-03-28T04:00:00+02:00',response.parsed_body.dig('countdown','target')
    post '/izracun/',params:{tool:'countdown',date:'2027-03-28',time:'04:00',zone:'fake/zone'},as: :json
    assert_response :unprocessable_entity
  end
  test 'all planner workbenches expose working edit preview and backup controls' do
    %w[ustvari-koledar prazen-koledar razpored-izmen solski-urnik rojstnodnevni-koledar dnevni-planer druzinski-planer].each do |slug|
      get "/#{slug}/"
      assert_response :success
      assert_select '#planner-entry'
      assert_select '#planner-ics'
      assert_select '[data-personal-preview]',15
      assert_select 'script[src*="planners"]'
    end
  end
  test 'authenticated content management leaves source gated pages held' do
    admin=Admin.create!(email:'test-editor',password:'a-long-test-password-123')
    post '/upravljanje/prijava/',params:{email:admin.email,password:'a-long-test-password-123'}
    assert_redirected_to '/upravljanje/'
    get '/upravljanje/'
    assert_response :success
    page=Page.where(status:'held').first
    post "/upravljanje/stran/#{page.id}/",params:{page:{title:page.title,description:'Opis',status:'published'}}
    assert_equal 'held',page.reload.status
  end
  test 'personal photo preview and exports are session bound' do
    file=Rack::Test::UploadedFile.new(Rails.root.join('public/images/observances/bozic.webp'),'image/webp')
    post '/fotografija/',params:{photo:file}
    assert_response :created
    token=response.parsed_body.fetch('token')
    options={type:'name',year:2028,name:'Črt Špela Žan',design:'min-03',photo_token:token}
    post '/zasebni-predogled/',params:{options:options},as: :json
    assert_response :success
    assert_equal 'image/png',response.media_type
    assert_equal 'private, no-store',response.headers['Cache-Control']
    other=open_session
    other.post '/zasebni-predogled/',params:{options:options},as: :json
    assert_equal 422,other.response.status
    post '/izvozi/',params:{options:options},as: :json
    assert_response :accepted
    request=PrintRequest.find(response.parsed_body['id'])
    assert request.private_file
    assert request.expires_at.future?
    other.get "/izvozi/#{request.id}/"
    assert_equal 404,other.response.status
  end
end

class InputLanguageTest < ActionDispatch::IntegrationTest
  test 'malformed calculator and print inputs return useful Slovene errors' do
    post '/izracun/',params:{tool:'date',from:'2027-01-03',to:'2027-01-01'},as: :json
    assert_response :success
    assert_includes response.parsed_body['result'],'-2 dneva'
    post '/izracun/',params:{tool:'date',from:'wrong',to:'2027-01-01'},as: :json
    assert_response :unprocessable_entity
    assert_equal 'Vnesite veljaven datum.',response.parsed_body['error']
    post '/izracun/',params:{tool:'date',from:'2027-01-01',to:'2027-01-02',delta:['wrong']},as: :json
    assert_response :unprocessable_entity
    assert_includes response.parsed_body['error'],'Preverite obliko'
    post '/izvozi/',params:{options:{year:['wrong']}},as: :json
    assert_response :unprocessable_entity
    post '/ics/izvoz/',params:{events:['wrong']},as: :json
    assert_response :unprocessable_entity
  end
end
