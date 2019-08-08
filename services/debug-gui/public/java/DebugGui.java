import java.io.IOException;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

import org.apache.commons.lang3.exception.ExceptionUtils;

import com.fasterxml.jackson.core.JsonGenerationException;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;

public class DebugGui {

	public static void main(String...args) {
		DebugGui.link("beta", "mylabel", "http://www.google.com");
		DebugGui.link("delta.foxtrot", "my2ndlabel", "http://www.google.com");
		DebugGui.value("beta.charlie", "mylabel", "http://www.google.com");
		DebugGui.log("beta.charlie", "mylog1: http://www.google.com");
		DebugGui.log("beta.charlie", "mylog2: http://www.google.com");
		DebugGui.log("beta.charlie", "mylog3: http://www.google.com");
		DebugGui.log("beta.charlie", "mylog4: http://www.google.com");
		DebugGui.exception("beta.charlie.echo", "myException", new Error("my message"));
	}
	
	private static String host = "http://localhost:3333/";
	
	public static void setHost(String host) {
		DebugGui.host = host;
	}
	
	private static String toJson(Object obj) {
	      ObjectMapper mapper = new ObjectMapper();
	      try
	      {
	         return mapper.writeValueAsString(obj);
	      } catch (JsonGenerationException e)
	      {
	         e.printStackTrace();
	      } catch (JsonMappingException e)
	      {
	         e.printStackTrace();
	      } catch (IOException e)
	      {
	         e.printStackTrace();
	      }
	      return "{}";
	}
	
	
	
	private static String getUrl(String ext, String id, String group) {
		return getUrl(ext, id) + "/" + group;
	}
	
	private static String getUrl(String ext, String id) {
		return host + ext + "/" + id;
	}
	
	private static class Link {
		public String label;
		public String url;
		public Link(String label, String url) {
			this.label = label;
			this.url = url;
		}
		public String toString() {
			return toJson(this); 
		}
	}
	
	private static class Value {
		public String key;
		public String value;
		public Value(String key, String value) {
			this.key = key;
			this.value = value;
		}
		public String toString() {
			return toJson(this); 
		}
	}
	
	private static class Exception {
		public String id; 
		public String msg;
		public String stacktrace;
		public Exception(String id, String msg, String stacktrace) {
			this.id = id;
			this.msg = msg;
			this.stacktrace = stacktrace;
		}
		public String toString() {
			return toJson(this); 
		}
	}

	private static class Log {
		public String log;
		public Log(String log) {
			this.log = log;
		}
		public String toString() {
			return toJson(this); 
		}
	}
	
	private static void restPostCall(String uri, Object obj) {
		try {
			URL url = new URL(uri);
			HttpURLConnection con = (HttpURLConnection) url.openConnection();
			con.setRequestMethod("POST");
			con.setDoOutput(true);
			con.setRequestProperty("Content-Type","application/json");  
			
			byte[] outputInBytes = obj.toString().getBytes("UTF-8");
			con.setRequestProperty("Content-Length", "" + Integer.toString(outputInBytes.length));
			OutputStream os = con.getOutputStream();
			os.write( outputInBytes );    
			os.close();
		
			con.getResponseCode();
			con.disconnect();
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
	
	public static void link(String group, String label, String url) {
		restPostCall(getUrl("link", getId(), getGroup(group)), new Link(label, url));
	}
	public static void value(String group, String key, String value) {
		restPostCall(getUrl("value", getId(), getGroup(group)), new Value(key, value));
	}
	public static void exception(String group, String errorId, Throwable error) {
		restPostCall(getUrl("exception", getId(), getGroup(group)), new Exception(errorId, error.getMessage(), ExceptionUtils.getStackTrace(error)));
	}
	public static void log(String group, String log) {
		restPostCall(getUrl("log", getId()), new Log(log));
	}
	
	private static String getId() {
		return "test";
	}

	private static String getGroup(String minor) {
		return "DebugGui." + minor;
	}
}
